package com.telecareplus.service.communication;

public record OtpDispatchResult(
        String phone,
        String message,
        long expiresInSeconds,
        String provider
) {}
