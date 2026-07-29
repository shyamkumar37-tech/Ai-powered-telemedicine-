package com.telecareplus.communication;

import com.telecareplus.communication.DeliveryReceipt;

public interface NotificationChannelProvider {
    String providerName();
    OutboundNotificationChannel channel();
    boolean isEnabled();
    DeliveryReceipt send(OutboundNotification notification);
}
