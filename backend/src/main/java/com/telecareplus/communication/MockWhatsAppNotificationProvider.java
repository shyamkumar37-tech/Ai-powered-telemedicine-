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
