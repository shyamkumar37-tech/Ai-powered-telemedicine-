package com.telecareplus.service.communication;

public interface NotificationChannelProvider {
    String providerName();
    OutboundNotificationChannel channel();
    boolean isEnabled();
    DeliveryReceipt send(OutboundNotification notification);
}
