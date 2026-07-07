package com.telecareplus.service.communication;

public interface OtpDeliveryProvider {
    String providerName();
    boolean isEnabled();
    DeliveryReceipt sendOtp(String phone, String otp, long ttlSeconds);
}
