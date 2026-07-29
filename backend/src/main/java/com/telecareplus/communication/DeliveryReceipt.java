package com.telecareplus.communication;

public record DeliveryReceipt(
        boolean accepted,
        String channel,
        String provider,
        String summary,
        String preview
) {}
