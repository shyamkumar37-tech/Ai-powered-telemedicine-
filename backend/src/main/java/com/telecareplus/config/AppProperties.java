package com.telecareplus.config;

import java.util.List;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private Jwt jwt = new Jwt();
    private Cors cors = new Cors();
    private Auth auth = new Auth();
    private Ai ai = new Ai();
    private Integrations integrations = new Integrations();
    private Demo demo = new Demo();

    @Getter
    @Setter
    public static class Jwt {
        private String secret = "telecareplus-super-secure-academic-secret-key-telecareplus";
        private long expirationMs = 86_400_000L;
    }

    @Getter
    @Setter
    public static class Cors {
        private List<String> allowedOrigins = List.of("http://localhost:5173", "http://127.0.0.1:5173");
    }

    @Getter
    @Setter
    public static class Auth {
        private Otp otp = new Otp();

        @Getter
        @Setter
        public static class Otp {
            private boolean demoMode = true;
            private long ttlSeconds = 300L;
            private long resendCooldownSeconds = 60L;
            private int maxAttempts = 5;
            private int maxRequestsPerWindow = 5;
            private long requestWindowSeconds = 900L;
            private String senderLabel = "TeleCare+";
        }
    }

    @Getter
    @Setter
    public static class Ai {
        private boolean enabled = false;
        private String provider = "local";
        private String apiBaseUrl = "http://localhost:11434";
        private String apiKey;
        private String model;
        private int timeoutSeconds = 20;
        private double temperature = 0.2d;
    }

    @Getter
    @Setter
    public static class Integrations {
        private Channel sms = new Channel();
        private Channel email = new Channel();
        private Channel whatsapp = new Channel();
        private Channel push = new Channel();
        private Twilio twilio = new Twilio();
    }

    @Getter
    @Setter
    public static class Demo {
        private boolean seedEnabled = true;
        private boolean seedEndpointEnabled = true;
    }

    @Getter
    @Setter
    public static class Channel {
        private boolean enabled = false;
        private String mode = "mock";
        private String provider = "mock";
        private String from = "TeleCare+";
        private String apiBaseUrl = "https://api.twilio.com";
        private String accountSid;
        private String authToken;
        private String messagingServiceSid;
        private String subject = "mailto:alerts@telecareplus.local";
        private String publicKey;
        private String privateKey;
    }

    @Getter
    @Setter
    public static class Twilio {
        private String accountSid;
        private String authToken;
    }
}
