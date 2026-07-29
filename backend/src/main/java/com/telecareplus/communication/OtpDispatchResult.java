package com.telecareplus.communication;

public record OtpDispatchResult(
        String phone,
        String message,
        long expiresInSeconds,
        String provider
) {}
