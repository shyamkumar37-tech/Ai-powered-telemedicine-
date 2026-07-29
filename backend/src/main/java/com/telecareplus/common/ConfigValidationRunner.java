package com.telecareplus.common;

import java.util.Arrays;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ConfigValidationRunner implements ApplicationRunner {

    private static final String DEFAULT_JWT_SECRET = "telecareplus-super-secure-academic-secret-key-telecareplus";
    private static final String OLD_COMPOSE_JWT_SECRET = "replace-with-a-long-random-secret";

    private final AppProperties appProperties;
    private final Environment environment;

    @Override
    public void run(ApplicationArguments args) {
        boolean isProd = Arrays.stream(environment.getActiveProfiles())
                .anyMatch(profile -> profile.equalsIgnoreCase("prod"));

        validateDatabaseCredentials();
        validateJwtSecret(isProd);
        validateOtpMode(isProd);
        logOptionalIntegrationWarnings();
    }

    private void validateDatabaseCredentials() {
        String username = environment.getProperty("spring.datasource.username");
        String password = environment.getProperty("spring.datasource.password");

        if (username == null || username.isBlank()) {
            throw new IllegalStateException("Database username is invalid. Set TELECARE_DB_USERNAME in .env using .env.example as a template.");
        }

        if (password == null || password.isBlank()) {
            throw new IllegalStateException("Database password is invalid. Set TELECARE_DB_PASSWORD in .env using .env.example as a template. Do not rely on local trust authentication or weak defaults.");
        }
    }

    private void validateJwtSecret(boolean isProd) {
        String secret = appProperties.getJwt().getSecret();
        boolean invalid = secret == null
                || secret.isBlank()
                || secret.equals(DEFAULT_JWT_SECRET)
                || secret.equals(OLD_COMPOSE_JWT_SECRET)
                || secret.length() < 32;

        if (invalid) {
            throw new IllegalStateException("JWT secret is invalid. Set TELECARE_JWT_SECRET in .env using .env.example as a template. Use at least 32 random characters and do not use old default values.");
        }
    }

    private void validateOtpMode(boolean isProd) {
        if (isProd && appProperties.getAuth().getOtp().isDemoMode()) {
            log.warn("OTP demo mode is enabled while running in production profile.");
        }
    }

    private void logOptionalIntegrationWarnings() {
        if (!appProperties.getAi().isEnabled()) {
            log.info("AI provider is disabled; AI features will use local fallback when available.");
        }
        if (!appProperties.getIntegrations().getSms().isEnabled()) {
            log.info("SMS integration disabled.");
        }
        if (!appProperties.getIntegrations().getEmail().isEnabled()) {
            log.info("Email integration disabled.");
        }
        if (!appProperties.getIntegrations().getWhatsapp().isEnabled()) {
            log.info("WhatsApp integration disabled.");
        }
    }
}
