package com.telecareplus.communication;

public record OutboundNotification(
        OutboundNotificationChannel channel,
        String recipient,
        String subject,
        String body,
        String referenceId
) {}
