package com.telecareplus.service.communication;

public record DeliveryReceipt(
        boolean accepted,
        String channel,
        String provider,
        String summary,
        String preview
) {}
