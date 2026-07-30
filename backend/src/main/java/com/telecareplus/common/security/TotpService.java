package com.telecareplus.common.security;

import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;

/**
 * RFC 6238 Compliant TOTP Multi-Factor Authentication Service for Doctor & Admin Roles.
 * Conforms to NIST SP 800-63B Multi-Factor Authentication requirements.
 */
@Service
public class TotpService {

    /**
     * Verifies a 6-digit TOTP code against a secret key.
     *
     * @param secretKey Base32/Base64 encoded TOTP secret key
     * @param code 6-digit TOTP code input
     * @return true if valid within time window
     */
    public boolean verifyCode(String secretKey, String code) {
        if (secretKey == null || code == null || code.length() != 6) {
            return false;
        }

        try {
            long currentWindow = Instant.now().getEpochSecond() / 30;
            // Check current window and +/- 1 window for clock skew tolerance
            for (int i = -1; i <= 1; i++) {
                String generated = generateTotp(secretKey, currentWindow + i);
                if (generated.equals(code)) {
                    return true;
                }
            }
        } catch (Exception e) {
            return false;
        }

        return false;
    }

    private String generateTotp(String secretKey, long timeWindow) throws NoSuchAlgorithmException, InvalidKeyException {
        byte[] key = Base64.getDecoder().decode(secretKey.getBytes());
        byte[] data = ByteBuffer.allocate(8).putLong(timeWindow).array();

        Mac mac = Mac.getInstance("HmacSHA1");
        mac.init(new SecretKeySpec(key, "HmacSHA1"));
        byte[] hash = mac.doFinal(data);

        int offset = hash[hash.length - 1] & 0xf;
        int binary = ((hash[offset] & 0x7f) << 24)
                | ((hash[offset + 1] & 0xff) << 16)
                | ((hash[offset + 2] & 0xff) << 8)
                | (hash[offset + 3] & 0xff);

        int otp = binary % 1000000;
        return String.format("%06d", otp);
    }
}
