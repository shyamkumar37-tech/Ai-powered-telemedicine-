package com.telecareplus.communication;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.telecareplus.common.AppProperties;
import com.telecareplus.communication.BrowserPushSubscription;
import com.telecareplus.users.Caregiver;
import com.telecareplus.users.Patient;
import com.telecareplus.communication.BrowserPushSubscriptionRepository;
import com.telecareplus.users.CaregiverRepository;
import com.telecareplus.users.PatientRepository;
import com.telecareplus.communication.DeliveryReceipt;
import com.telecareplus.communication.NotificationChannelProvider;
import com.telecareplus.communication.OutboundNotification;
import com.telecareplus.communication.OutboundNotificationChannel;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.apache.http.HttpResponse;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class WebPushNotificationProvider implements NotificationChannelProvider {

    private static final Pattern MESSAGE_PATTERN = Pattern.compile("Message:\\s*(.+)");

    private final AppProperties appProperties;
    private final BrowserPushSubscriptionRepository browserPushSubscriptionRepository;
    private final PatientRepository patientRepository;
    private final CaregiverRepository caregiverRepository;
    private final ObjectMapper objectMapper;

    static {
        if (java.security.Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            java.security.Security.addProvider(new BouncyCastleProvider());
        }
    }

    @Override
    public String providerName() {
        return "browser";
    }

    @Override
    public OutboundNotificationChannel channel() {
        return OutboundNotificationChannel.PUSH;
    }

    @Override
    public boolean isEnabled() {
        AppProperties.Channel push = appProperties.getIntegrations().getPush();
        String provider = push.getProvider();
        boolean providerMatches = provider != null
                && ("browser".equalsIgnoreCase(provider) || "webpush".equalsIgnoreCase(provider));
        return push.isEnabled()
                && providerMatches
                && push.getPublicKey() != null && !push.getPublicKey().isBlank()
                && push.getPrivateKey() != null && !push.getPrivateKey().isBlank()
                && push.getSubject() != null && !push.getSubject().isBlank();
    }

    @Override
    public DeliveryReceipt send(OutboundNotification notification) {
        if (!isEnabled()) {
            return new DeliveryReceipt(false, channel().name(), providerName(), "Browser push is disabled.", null);
        }

        Optional<Long> userId = resolveUserId(notification.recipient());
        if (userId.isEmpty()) {
            return new DeliveryReceipt(false, channel().name(), providerName(), "No push recipient resolved.", null);
        }

        List<BrowserPushSubscription> subscriptions = browserPushSubscriptionRepository.findByUserIdAndActiveTrue(userId.get());
        if (subscriptions.isEmpty()) {
            return new DeliveryReceipt(false, channel().name(), providerName(), "No active browser subscriptions for recipient.", null);
        }

        int delivered = 0;
        List<BrowserPushSubscription> staleSubscriptions = new ArrayList<>();
        String payload = buildPayload(notification);

        for (BrowserPushSubscription subscription : subscriptions) {
            try {
                PushService pushService = new PushService();
                pushService.setSubject(appProperties.getIntegrations().getPush().getSubject());
                pushService.setPublicKey(appProperties.getIntegrations().getPush().getPublicKey());
                pushService.setPrivateKey(appProperties.getIntegrations().getPush().getPrivateKey());
                Notification webPushNotification = new Notification(
                        subscription.getEndpoint(),
                        subscription.getPublicKey(),
                        subscription.getAuthSecret(),
                        payload
                );
                HttpResponse response = pushService.send(webPushNotification);
                int statusCode = response.getStatusLine().getStatusCode();
                if (statusCode >= 200 && statusCode < 300) {
                    delivered++;
                } else if (statusCode == 404 || statusCode == 410) {
                    staleSubscriptions.add(subscription);
                } else {
                    log.warn("TeleCare+ browser push returned status {} for {}", statusCode, subscription.getEndpoint());
                }
            } catch (Exception ex) {
                String message = ex.getMessage() == null ? "" : ex.getMessage();
                if (message.contains("410") || message.contains("404")) {
                    staleSubscriptions.add(subscription);
                } else {
                    log.warn("TeleCare+ browser push failed for {}: {}", subscription.getEndpoint(), message);
                }
            }
        }

        if (!staleSubscriptions.isEmpty()) {
            staleSubscriptions.forEach(subscription -> subscription.setActive(false));
            browserPushSubscriptionRepository.saveAll(staleSubscriptions);
        }

        return new DeliveryReceipt(
                delivered > 0,
                channel().name(),
                providerName(),
                delivered > 0
                        ? "Browser push dispatched to " + delivered + " subscription(s)."
                        : "No browser push notifications were delivered.",
                null
        );
    }

    private Optional<Long> resolveUserId(String recipient) {
        if (recipient == null || recipient.isBlank() || !recipient.contains(":")) {
            return Optional.empty();
        }

        String[] parts = recipient.split(":", 2);
        if (parts.length != 2) {
            return Optional.empty();
        }

        Long targetId;
        try {
            targetId = Long.parseLong(parts[1]);
        } catch (NumberFormatException ex) {
            return Optional.empty();
        }

        return switch (parts[0].toLowerCase()) {
            case "patient" -> patientRepository.findById(targetId).map(Patient::getUser).map(user -> user.getId());
            case "caregiver" -> caregiverRepository.findById(targetId).map(Caregiver::getUser).map(user -> user.getId());
            default -> Optional.empty();
        };
    }

    private String buildPayload(OutboundNotification notification) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("title", notification.subject());
        payload.put("body", extractMessage(notification.body()));
        payload.put("tag", notification.referenceId());
        payload.put("url", buildTargetUrl(notification.recipient()));
        payload.put("channel", notification.channel().name());
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (Exception ex) {
            log.warn("TeleCare+ unable to serialize browser push payload: {}", ex.getMessage());
            return "{\"title\":\"TeleCare+ Alert\",\"body\":\"New alert available in TeleCare+.\"}";
        }
    }

    private String extractMessage(String body) {
        Matcher matcher = MESSAGE_PATTERN.matcher(body == null ? "" : body);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return body == null ? "New alert available in TeleCare+." : body;
    }

    private String buildTargetUrl(String recipient) {
        if (recipient == null) {
            return "/";
        }
        if (recipient.startsWith("caregiver:")) {
            return "/caregiver/alerts";
        }
        if (recipient.startsWith("patient:")) {
            return "/patient/alerts";
        }
        return "/";
    }
}
