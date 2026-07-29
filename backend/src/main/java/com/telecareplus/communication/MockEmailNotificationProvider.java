package com.telecareplus.communication;

import com.telecareplus.common.AppProperties;
import com.telecareplus.communication.DeliveryReceipt;
import com.telecareplus.communication.NotificationChannelProvider;
import com.telecareplus.communication.OutboundNotification;
import com.telecareplus.communication.OutboundNotificationChannel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class MockEmailNotificationProvider implements NotificationChannelProvider {

    private final AppProperties appProperties;

    @Override
    public String providerName() {
        return "mock";
    }

    @Override
    public OutboundNotificationChannel channel() {
        return OutboundNotificationChannel.EMAIL;
    }

    @Override
    public boolean isEnabled() {
        return appProperties.getIntegrations().getEmail().isEnabled()
                && "mock".equalsIgnoreCase(appProperties.getIntegrations().getEmail().getProvider());
    }

    @Override
    public DeliveryReceipt send(OutboundNotification notification) {
        log.info("[TeleCare+] Email notification via {}:{} to {}", appProperties.getIntegrations().getEmail().getProvider(), appProperties.getIntegrations().getEmail().getMode(), notification.recipient());
        return new DeliveryReceipt(
                isEnabled(),
                channel().name(),
                appProperties.getIntegrations().getEmail().getProvider(),
                isEnabled() ? "Email notification dispatched." : "Email provider is disabled; mock dispatch recorded only.",
                null
        );
    }
}
