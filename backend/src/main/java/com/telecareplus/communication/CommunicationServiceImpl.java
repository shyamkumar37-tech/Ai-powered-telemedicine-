package com.telecareplus.communication;

import com.telecareplus.notification.AlertNotificationEvent;

import com.telecareplus.users.CaregiverInvitedEvent;

import com.telecareplus.communication.OutboundNotificationChannel;

import com.telecareplus.common.AppProperties;
import com.telecareplus.users.Caregiver;
import com.telecareplus.users.Patient;
import com.telecareplus.users.User;
import com.telecareplus.common.AlertSeverity;
import com.telecareplus.common.BadRequestException;
import com.telecareplus.communication.CommunicationService;
import com.telecareplus.communication.DeliveryReceipt;
import com.telecareplus.communication.NotificationChannelProvider;
import com.telecareplus.communication.OtpDeliveryProvider;
import com.telecareplus.communication.OtpDispatchResult;
import com.telecareplus.communication.OutboundNotification;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class CommunicationServiceImpl implements CommunicationService {

    private final AppProperties appProperties;
    private final List<OtpDeliveryProvider> otpDeliveryProviders;
    private final List<NotificationChannelProvider> notificationChannelProviders;

    @Override
    public OtpDispatchResult dispatchLoginOtp(User user, String otp, long ttlSeconds) {
        String configuredProvider = appProperties.getIntegrations().getSms().getProvider();
        OtpDeliveryProvider provider = otpDeliveryProviders.stream()
                .filter(item -> item.providerName().equalsIgnoreCase(configuredProvider))
                .filter(OtpDeliveryProvider::isEnabled)
                .findFirst()
                .or(() -> otpDeliveryProviders.stream()
                        .filter(item -> item.providerName().equalsIgnoreCase("mock"))
                        .filter(OtpDeliveryProvider::isEnabled)
                        .findFirst())
                .orElseThrow(() -> new BadRequestException("No OTP delivery provider is enabled"));
        DeliveryReceipt receipt = provider.sendOtp(user.getPhone(), otp, ttlSeconds);
        return new OtpDispatchResult(
                user.getPhone(),
                receipt.summary(),
                ttlSeconds,
                receipt.provider()
        );
    }

    @Override
    public List<DeliveryReceipt> dispatchAlertNotifications(Patient patient, List<Caregiver> caregivers, AlertSeverity severity, String message, String referenceId) {
        String subject = "TeleCare+ " + severity.name() + " alert";
        String body = buildAlertBody(patient, severity, message);
        List<DeliveryReceipt> receipts = new ArrayList<>();

        notificationChannelProviders.stream().filter(NotificationChannelProvider::isEnabled).forEach(provider -> {
            try {
                receipts.addAll(dispatchForProvider(provider, patient, caregivers, subject, body, referenceId));
            } catch (Exception ex) {
                log.warn("TeleCare+ provider {} failed for alert {}: {}", provider.channel(), referenceId, ex.getMessage());
            }
        });

        return receipts;
    }

    @Override
    public void sendEmail(String to, String subject, String body) {
        notificationChannelProviders.stream()
                .filter(provider -> provider.channel() == OutboundNotificationChannel.EMAIL)
                .filter(NotificationChannelProvider::isEnabled)
                .findFirst()
                .ifPresentOrElse(
                        provider -> {
                            try {
                                provider.send(new OutboundNotification(provider.channel(), to, subject, body, "email-direct"));
                            } catch (Exception ex) {
                                log.warn("Failed to send direct email to {}: {}", to, ex.getMessage());
                            }
                        },
                        () -> log.warn("No active EMAIL provider found to send email to {}", to)
                );
    }

    private List<DeliveryReceipt> dispatchForProvider(
            NotificationChannelProvider provider,
            Patient patient,
            List<Caregiver> caregivers,
            String subject,
            String body,
            String referenceId
    ) {
        List<DeliveryReceipt> receipts = new ArrayList<>();
        switch (provider.channel()) {
            case SMS, WHATSAPP -> {
                if (patient.getUser().isSmsNotificationsEnabled()) {
                    addIfPresent(receipts, provider, patient.getUser().getPhone(), subject, body, referenceId);
                }
                caregivers.forEach(caregiver -> {
                    if (caregiver.getUser().isSmsNotificationsEnabled()) {
                        addIfPresent(receipts, provider, caregiver.getUser().getPhone(), subject, body, referenceId);
                    }
                });
            }
            case EMAIL -> {
                if (patient.getUser().isEmailNotificationsEnabled()) {
                    addIfPresent(receipts, provider, patient.getUser().getEmail(), subject, body, referenceId);
                }
                caregivers.forEach(caregiver -> {
                    if (caregiver.getUser().isEmailNotificationsEnabled()) {
                        addIfPresent(receipts, provider, caregiver.getUser().getEmail(), subject, body, referenceId);
                    }
                });
            }
            case PUSH -> {
                if (patient.getUser().isPushNotificationsEnabled()) {
                    addIfPresent(receipts, provider, "patient:" + patient.getId(), subject, body, referenceId);
                }
                caregivers.forEach(caregiver -> {
                    if (caregiver.getUser().isPushNotificationsEnabled()) {
                        addIfPresent(receipts, provider, "caregiver:" + caregiver.getId(), subject, body, referenceId);
                    }
                });
            }
        }
        return receipts;
    }

    private void addIfPresent(
            List<DeliveryReceipt> receipts,
            NotificationChannelProvider provider,
            String recipient,
            String subject,
            String body,
            String referenceId
    ) {
        if (recipient == null || recipient.isBlank()) {
            return;
        }
        receipts.add(provider.send(new OutboundNotification(provider.channel(), recipient, subject, body, referenceId)));
    }

    private String buildAlertBody(Patient patient, AlertSeverity severity, String message) {
        return "Patient: " + patient.getUser().getFullName() + System.lineSeparator()
                + "Severity: " + severity.name() + System.lineSeparator()
                + "Message: " + message + System.lineSeparator()
                + "Platform: TeleCare+ continuity monitoring";
    }

    @org.springframework.context.event.EventListener
    public void onCaregiverInvited(com.telecareplus.users.CaregiverInvitedEvent event) {
        String message = String.format("Hello,\n\n%s has invited you to join their Care Network on TeleCare+ as their %s.\n\nPlease click the link below to register and accept the invitation:\n%s\n\n- The TeleCare+ Team",
                event.patientName(), event.relationship(), event.inviteLink());
        sendEmail(event.caregiverEmail(), "TeleCare+ Caregiver Invitation", message);
    }

    @org.springframework.context.event.EventListener
    public void onAlertNotification(com.telecareplus.notification.AlertNotificationEvent event) {
        dispatchAlertNotifications(event.patient(), event.caregivers(), event.severity(), event.message(), event.referenceId());
    }
}
