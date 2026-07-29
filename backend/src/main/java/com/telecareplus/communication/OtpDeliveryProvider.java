package com.telecareplus.communication;

import com.telecareplus.communication.DeliveryReceipt;

public interface OtpDeliveryProvider {
    String providerName();
    boolean isEnabled();
    DeliveryReceipt sendOtp(String phone, String otp, long ttlSeconds);
}
