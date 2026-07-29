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
public class MockSmsNotificationProvider implements NotificationChannelProvider {

    private final AppProperties appProperties;

    @Override
    public String providerName() {
        return "mock";
    }

    @Override
    public OutboundNotificationChannel channel() {
        return OutboundNotificationChannel.SMS;
    }

    @Override
    public boolean isEnabled() {
        return appProperties.getIntegrations().getSms().isEnabled()
                && "mock".equalsIgnoreCase(appProperties.getIntegrations().getSms().getProvider());
    }

    @Override
    public DeliveryReceipt send(OutboundNotification notification) {
        log.info("[TeleCare+] SMS notification via {}:{} to {}", appProperties.getIntegrations().getSms().getProvider(), appProperties.getIntegrations().getSms().getMode(), notification.recipient());
        return new DeliveryReceipt(
                isEnabled(),
                channel().name(),
                appProperties.getIntegrations().getSms().getProvider(),
                isEnabled() ? "SMS notification dispatched." : "SMS provider is disabled; mock dispatch recorded only.",
                null
        );
    }
}
