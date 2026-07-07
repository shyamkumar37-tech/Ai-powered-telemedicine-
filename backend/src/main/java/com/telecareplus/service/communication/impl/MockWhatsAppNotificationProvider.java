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
public class MockWhatsAppNotificationProvider implements NotificationChannelProvider {

    private final AppProperties appProperties;

    @Override
    public String providerName() {
        return "mock";
    }

    @Override
    public OutboundNotificationChannel channel() {
        return OutboundNotificationChannel.WHATSAPP;
    }

    @Override
    public boolean isEnabled() {
        return appProperties.getIntegrations().getWhatsapp().isEnabled()
                && "mock".equalsIgnoreCase(appProperties.getIntegrations().getWhatsapp().getProvider());
    }

    @Override
    public DeliveryReceipt send(OutboundNotification notification) {
        log.info("[TeleCare+] WhatsApp notification via {}:{} to {}", appProperties.getIntegrations().getWhatsapp().getProvider(), appProperties.getIntegrations().getWhatsapp().getMode(), notification.recipient());
        return new DeliveryReceipt(
                isEnabled(),
                channel().name(),
                appProperties.getIntegrations().getWhatsapp().getProvider(),
                isEnabled() ? "WhatsApp notification dispatched." : "WhatsApp provider is disabled; mock dispatch recorded only.",
                null
        );
    }
}
