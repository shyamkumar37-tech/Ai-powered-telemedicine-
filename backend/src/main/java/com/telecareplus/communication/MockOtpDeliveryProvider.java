package com.telecareplus.communication;

import com.telecareplus.common.AppProperties;
import com.telecareplus.communication.DeliveryReceipt;
import com.telecareplus.communication.OtpDeliveryProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class MockOtpDeliveryProvider implements OtpDeliveryProvider {

    private final AppProperties appProperties;

    @Override
    public String providerName() {
        return "mock";
    }

    @Override
    public boolean isEnabled() {
        return "mock".equalsIgnoreCase(appProperties.getIntegrations().getSms().getProvider())
                || appProperties.getAuth().getOtp().isDemoMode();
    }

    @Override
    public DeliveryReceipt sendOtp(String phone, String otp, long ttlSeconds) {
        String provider = appProperties.getIntegrations().getSms().getProvider();
        String mode = appProperties.getIntegrations().getSms().getMode();
        boolean demoMode = appProperties.getAuth().getOtp().isDemoMode();
        log.info("[TeleCare+] OTP dispatch via {}:{} to {}", provider, mode, phone);
        return new DeliveryReceipt(
                true,
                "SMS",
                provider,
                demoMode
                        ? "OTP generated successfully. Use it within 5 minutes."
                        : "OTP accepted by the configured SMS delivery layer.",
                null
        );
    }
}
