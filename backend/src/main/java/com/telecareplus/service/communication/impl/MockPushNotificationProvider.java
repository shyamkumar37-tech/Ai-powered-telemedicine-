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
public class MockPushNotificationProvider implements NotificationChannelProvider {

    private final AppProperties appProperties;

    @Override
    public String providerName() {
        return "mock";
    }

    @Override
    public OutboundNotificationChannel channel() {
        return OutboundNotificationChannel.PUSH;
    }

    @Override
    public boolean isEnabled() {
        return appProperties.getIntegrations().getPush().isEnabled()
                && "mock".equalsIgnoreCase(appProperties.getIntegrations().getPush().getProvider());
    }

    @Override
    public DeliveryReceipt send(OutboundNotification notification) {
        log.info("[TeleCare+] Push notification via {}:{} to {}", appProperties.getIntegrations().getPush().getProvider(), appProperties.getIntegrations().getPush().getMode(), notification.recipient());
        return new DeliveryReceipt(
                isEnabled(),
                channel().name(),
                appProperties.getIntegrations().getPush().getProvider(),
                isEnabled() ? "Push notification dispatched." : "Push provider is disabled; mock dispatch recorded only.",
                null
        );
    }
}
