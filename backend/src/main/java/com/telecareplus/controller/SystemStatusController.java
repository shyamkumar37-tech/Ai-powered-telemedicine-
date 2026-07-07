package com.telecareplus.controller;

import com.telecareplus.config.AppProperties;
import com.telecareplus.repository.CaregiverRepository;
import com.telecareplus.repository.DoctorRepository;
import com.telecareplus.repository.PatientRepository;
import com.telecareplus.repository.PharmacistRepository;
import com.telecareplus.repository.UserRepository;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import com.telecareplus.config.DataSeeder;

@RestController
@RequestMapping("/api/system")
@RequiredArgsConstructor
public class SystemStatusController {

    private final JdbcTemplate jdbcTemplate;
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final CaregiverRepository caregiverRepository;
    private final PharmacistRepository pharmacistRepository;
    private final AppProperties appProperties;
    private final DataSeeder dataSeeder;

    @Value("${spring.mail.host:}")
    private String smtpHost;

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;

    @GetMapping("/status")
    public Map<String, Object> getStatus() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("timestamp", Instant.now().toString());
        response.put("application", "TeleCare+");
        response.put("database", buildPublicDatabaseStatus());
        response.put("services", buildPublicServiceStatus());
        response.put("optionalServices", buildPublicOptionalServiceStatus());
        response.put("ready", Boolean.TRUE.equals(((Map<?, ?>) response.get("database")).get("connected")));
        response.put("status", Boolean.TRUE.equals(((Map<?, ?>) response.get("database")).get("connected")) ? "UP" : "DEGRADED");
        return response;
    }

    @GetMapping("/status/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> getAdminStatus() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("timestamp", Instant.now().toString());
        response.put("application", "TeleCare+");
        response.put("database", buildDatabaseStatus());
        response.put("ai", buildAiStatus());
        response.put("providers", buildProviderStatus());
        response.put("dataCounts", buildDataCounts());
        response.put("warnings", buildWarnings());
        response.put("ready", Boolean.TRUE.equals(((Map<?, ?>) response.get("database")).get("connected")));
        return response;
    }

    @PostMapping("/demo/seed")
    public Map<String, Object> seedDemoData() {
        if (appProperties.getDemo() == null || !appProperties.getDemo().isSeedEndpointEnabled()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Demo seeding is disabled.");
        }

        dataSeeder.seedDemoData();
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("timestamp", Instant.now().toString());
        response.put("status", "SEEDED");
        response.put("dataCounts", buildDataCounts());
        return response;
    }

    private Map<String, Object> buildDatabaseStatus() {
        Map<String, Object> database = new LinkedHashMap<>();
        Integer ping = jdbcTemplate.queryForObject("select 1", Integer.class);
        database.put("connected", ping != null && ping == 1);
        return database;
    }

    private Map<String, Object> buildPublicDatabaseStatus() {
        Map<String, Object> database = new LinkedHashMap<>();
        Integer ping = jdbcTemplate.queryForObject("select 1", Integer.class);
        database.put("connected", ping != null && ping == 1);
        database.put("status", ping != null && ping == 1 ? "UP" : "DOWN");
        return database;
    }

    private Map<String, Object> buildPublicServiceStatus() {
        Map<String, Object> services = new LinkedHashMap<>();
        services.put("ai", isAiLive() ? "AVAILABLE" : "UNAVAILABLE");
        services.put("notifications", isChannelLive(appProperties.getIntegrations().getPush()) ? "AVAILABLE" : "UNAVAILABLE");
        services.put("otp", appProperties.getAuth().getOtp().isDemoMode() ? "AVAILABLE" : "AVAILABLE");
        return services;
    }

    private Map<String, Object> buildPublicOptionalServiceStatus() {
        Map<String, Object> optional = new LinkedHashMap<>();
        optional.put("sms", isChannelLive(appProperties.getIntegrations().getSms()) ? "AVAILABLE" : "UNAVAILABLE");
        optional.put("email", isEmailLive(appProperties.getIntegrations().getEmail()) ? "AVAILABLE" : "UNAVAILABLE");
        optional.put("whatsapp", isChannelLive(appProperties.getIntegrations().getWhatsapp()) ? "AVAILABLE" : "UNAVAILABLE");
        optional.put("labSync", "UNAVAILABLE");
        optional.put("ehr", "UNAVAILABLE");
        optional.put("payment", "UNAVAILABLE");
        optional.put("insurance", "UNAVAILABLE");
        return optional;
    }

    private Map<String, Object> buildProviderStatus() {
        Map<String, Object> providers = new LinkedHashMap<>();
        providers.put("sms", buildChannelStatus(appProperties.getIntegrations().getSms()));
        providers.put("email", buildEmailStatus(appProperties.getIntegrations().getEmail()));
        providers.put("whatsapp", buildChannelStatus(appProperties.getIntegrations().getWhatsapp()));
        providers.put("push", buildPushStatus(appProperties.getIntegrations().getPush()));
        providers.put("otpDemoMode", appProperties.getAuth().getOtp().isDemoMode());
        return providers;
    }

    private Map<String, Object> buildChannelStatus(AppProperties.Channel channel) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("enabled", channel.isEnabled());
        data.put("provider", channel.getProvider());
        data.put("mode", channel.getMode());
        data.put("configured", isChannelConfigured(channel));
        data.put("live", isChannelLive(channel));
        return data;
    }

    private Map<String, Object> buildPushStatus(AppProperties.Channel channel) {
        Map<String, Object> data = buildChannelStatus(channel);
        data.put("publicKeyConfigured", channel.getPublicKey() != null && !channel.getPublicKey().isBlank());
        data.put("privateKeyConfigured", channel.getPrivateKey() != null && !channel.getPrivateKey().isBlank());
        return data;
    }

    private Map<String, Object> buildEmailStatus(AppProperties.Channel channel) {
        Map<String, Object> data = buildChannelStatus(channel);
        data.put("smtpHostConfigured", smtpHost != null && !smtpHost.isBlank());
        data.put("smtpUsernameConfigured", smtpUsername != null && !smtpUsername.isBlank());
        data.put("configured", isEmailConfigured(channel));
        data.put("live", isEmailLive(channel));
        return data;
    }

    private Map<String, Object> buildAiStatus() {
        Map<String, Object> ai = new LinkedHashMap<>();
        ai.put("enabled", appProperties.getAi().isEnabled());
        ai.put("provider", appProperties.getAi().getProvider());
        ai.put("model", appProperties.getAi().getModel());
        ai.put("configured", isAiConfigured());
        ai.put("live", isAiLive());
        return ai;
    }

    private java.util.List<String> buildWarnings() {
        java.util.List<String> warnings = new java.util.ArrayList<>();

        if (appProperties.getAuth().getOtp().isDemoMode()) {
            warnings.add("OTP is still running in demo mode.");
        }
        if (!isAiLive()) {
            warnings.add("AI guidance is using fallback or local behavior instead of a fully live provider.");
        }
        if (!isChannelLive(appProperties.getIntegrations().getSms())) {
            warnings.add("SMS alerts are not live yet.");
        }
        if (!isEmailLive(appProperties.getIntegrations().getEmail())) {
            warnings.add("Email alerts are not live yet.");
        }
        if (!isChannelLive(appProperties.getIntegrations().getWhatsapp())) {
            warnings.add("WhatsApp alerts are not live yet.");
        }
        if (!isChannelLive(appProperties.getIntegrations().getPush())) {
            warnings.add("Background push delivery is not fully live yet.");
        }
        if (!isAiConfigured()) {
            warnings.add("Free-text translation falls back to original text when no live AI translation provider is configured.");
        }
        warnings.add("Lab and wearable uploads currently rely on manual capture unless a vendor sync is configured.");
        warnings.add("Hospital EHR, payment, and insurance integrations are not connected in this environment.");
        if (datasourceUrl != null && (datasourceUrl.contains("localhost") || datasourceUrl.contains("127.0.0.1"))) {
            warnings.add("Database connectivity is still using a local development endpoint.");
        }
        if ("telecareplus-super-secure-academic-secret-key-telecareplus".equals(appProperties.getJwt().getSecret())) {
            warnings.add("JWT signing secret is still using the default development value and must be replaced for production.");
        }

        return warnings;
    }

    private Map<String, Object> buildDataCounts() {
        Map<String, Object> counts = new LinkedHashMap<>();
        counts.put("users", userRepository.count());
        counts.put("patients", patientRepository.count());
        counts.put("doctors", doctorRepository.count());
        counts.put("caregivers", caregiverRepository.count());
        counts.put("pharmacists", pharmacistRepository.count());
        return counts;
    }

    private boolean isAiConfigured() {
        if (!appProperties.getAi().isEnabled()) {
            return false;
        }

        String provider = appProperties.getAi().getProvider();
        if (provider == null || provider.isBlank() || "local".equalsIgnoreCase(provider)) {
            return false;
        }

        if ("ollama".equalsIgnoreCase(provider)) {
            return appProperties.getAi().getApiBaseUrl() != null
                    && !appProperties.getAi().getApiBaseUrl().isBlank()
                    && appProperties.getAi().getModel() != null
                    && !appProperties.getAi().getModel().isBlank();
        }

        return appProperties.getAi().getApiKey() != null
                && !appProperties.getAi().getApiKey().isBlank()
                && appProperties.getAi().getModel() != null
                && !appProperties.getAi().getModel().isBlank();
    }

    private boolean isAiLive() {
        return isAiConfigured() && !"local".equalsIgnoreCase(appProperties.getAi().getProvider());
    }

    private boolean isChannelConfigured(AppProperties.Channel channel) {
        if (channel == null || !channel.isEnabled()) {
            return false;
        }

        String provider = channel.getProvider();
        if (provider == null || provider.isBlank() || "mock".equalsIgnoreCase(provider)) {
            return false;
        }

        if ("browser".equalsIgnoreCase(provider) || "webpush".equalsIgnoreCase(provider)) {
            return channel.getPublicKey() != null
                    && !channel.getPublicKey().isBlank()
                    && channel.getPrivateKey() != null
                    && !channel.getPrivateKey().isBlank();
        }

        if ("twilio".equalsIgnoreCase(provider)) {
            String accountSid = channel.getAccountSid();
            if (accountSid == null || accountSid.isBlank()) {
                accountSid = appProperties.getIntegrations().getTwilio().getAccountSid();
            }

            String authToken = channel.getAuthToken();
            if (authToken == null || authToken.isBlank()) {
                authToken = appProperties.getIntegrations().getTwilio().getAuthToken();
            }

            return accountSid != null
                    && !accountSid.isBlank()
                    && authToken != null
                    && !authToken.isBlank()
                    && ((channel.getMessagingServiceSid() != null && !channel.getMessagingServiceSid().isBlank())
                    || (channel.getFrom() != null && !channel.getFrom().isBlank()));
        }

        return channel.getFrom() != null && !channel.getFrom().isBlank();
    }

    private boolean isChannelLive(AppProperties.Channel channel) {
        return channel != null
                && channel.isEnabled()
                && !"mock".equalsIgnoreCase(channel.getMode())
                && isChannelConfigured(channel);
    }

    private boolean isEmailConfigured(AppProperties.Channel channel) {
        return channel != null
                && channel.isEnabled()
                && !"mock".equalsIgnoreCase(channel.getProvider())
                && channel.getFrom() != null
                && !channel.getFrom().isBlank()
                && smtpHost != null
                && !smtpHost.isBlank()
                && smtpUsername != null
                && !smtpUsername.isBlank();
    }

    private boolean isEmailLive(AppProperties.Channel channel) {
        return channel != null
                && channel.isEnabled()
                && !"mock".equalsIgnoreCase(channel.getMode())
                && isEmailConfigured(channel);
    }
}
