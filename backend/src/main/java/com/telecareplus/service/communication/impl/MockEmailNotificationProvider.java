package com.telecareplus.service.communication.impl;

import com.telecareplus.config.AppProperties;
import com.telecareplus.service.communication.DeliveryReceipt;
import com.telecareplus.service.communication.NotificationChannelProvider;
import com.telecareplus.service.communication.OutboundNotification;
import com.telecareplus.service.communication.OutboundNotificationChannel;
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
