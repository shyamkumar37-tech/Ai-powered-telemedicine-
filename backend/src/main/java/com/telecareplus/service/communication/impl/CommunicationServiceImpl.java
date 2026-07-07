package com.telecareplus.service.communication.impl;

import com.telecareplus.config.AppProperties;
import com.telecareplus.entity.Caregiver;
import com.telecareplus.entity.Patient;
import com.telecareplus.entity.User;
import com.telecareplus.entity.enums.AlertSeverity;
import com.telecareplus.exception.BadRequestException;
import com.telecareplus.service.communication.CommunicationService;
import com.telecareplus.service.communication.DeliveryReceipt;
import com.telecareplus.service.communication.NotificationChannelProvider;
import com.telecareplus.service.communication.OtpDeliveryProvider;
import com.telecareplus.service.communication.OtpDispatchResult;
import com.telecareplus.service.communication.OutboundNotification;
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
                addIfPresent(receipts, provider, patient.getUser().getPhone(), subject, body, referenceId);
                caregivers.forEach(caregiver -> addIfPresent(receipts, provider, caregiver.getUser().getPhone(), subject, body, referenceId));
            }
            case EMAIL -> {
                addIfPresent(receipts, provider, patient.getUser().getEmail(), subject, body, referenceId);
                caregivers.forEach(caregiver -> addIfPresent(receipts, provider, caregiver.getUser().getEmail(), subject, body, referenceId));
            }
            case PUSH -> {
                addIfPresent(receipts, provider, "patient:" + patient.getId(), subject, body, referenceId);
                caregivers.forEach(caregiver -> addIfPresent(receipts, provider, "caregiver:" + caregiver.getId(), subject, body, referenceId));
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
}
