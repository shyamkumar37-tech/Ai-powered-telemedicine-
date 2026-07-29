package com.telecareplus.communication;

import com.telecareplus.common.AppProperties;
import com.telecareplus.communication.DeliveryReceipt;
import com.telecareplus.communication.NotificationChannelProvider;
import com.telecareplus.communication.OutboundNotification;
import com.telecareplus.communication.OutboundNotificationChannel;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TwilioWhatsAppNotificationProvider implements NotificationChannelProvider {

    private final AppProperties appProperties;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Override
    public String providerName() {
        return "twilio";
    }

    @Override
    public OutboundNotificationChannel channel() {
        return OutboundNotificationChannel.WHATSAPP;
    }

    @Override
    public boolean isEnabled() {
        AppProperties.Channel whatsapp = appProperties.getIntegrations().getWhatsapp();
        return whatsapp.isEnabled()
                && "twilio".equalsIgnoreCase(whatsapp.getProvider())
                && isPresent(resolveAccountSid(whatsapp))
                && isPresent(resolveAuthToken(whatsapp))
                && (isPresent(whatsapp.getFrom()) || isPresent(whatsapp.getMessagingServiceSid()));
    }

    @Override
    public DeliveryReceipt send(OutboundNotification notification) {
        AppProperties.Channel whatsapp = appProperties.getIntegrations().getWhatsapp();
        String response = sendTwilioMessage(whatsapp, ensureWhatsAppAddress(notification.recipient()), notification.body());
        return new DeliveryReceipt(true, channel().name(), "twilio", "WhatsApp notification dispatched via Twilio.", response);
    }

    private String sendTwilioMessage(AppProperties.Channel channel, String recipient, String body) {
        String accountSid = resolveAccountSid(channel);
        String authToken = resolveAuthToken(channel);
        String endpoint = channel.getApiBaseUrl() + "/2010-04-01/Accounts/" + accountSid + "/Messages.json";
        String payload = buildPayload(channel, recipient, body);
        String basicAuth = Base64.getEncoder().encodeToString((accountSid + ":" + authToken).getBytes(StandardCharsets.UTF_8));

        HttpRequest request = HttpRequest.newBuilder(URI.create(endpoint))
                .header("Authorization", "Basic " + basicAuth)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                throw new IllegalStateException("Twilio WhatsApp rejected request with status " + response.statusCode());
            }
            return response.body();
        } catch (IOException | InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Twilio WhatsApp delivery failed", ex);
        }
    }

    private String buildPayload(AppProperties.Channel channel, String recipient, String body) {
        StringBuilder payload = new StringBuilder();
        if (isPresent(channel.getMessagingServiceSid())) {
            payload.append("MessagingServiceSid=").append(encode(channel.getMessagingServiceSid())).append("&");
        } else {
            payload.append("From=").append(encode(ensureWhatsAppAddress(channel.getFrom()))).append("&");
        }
        payload.append("To=").append(encode(recipient)).append("&");
        payload.append("Body=").append(encode(body));
        return payload.toString();
    }

    private String resolveAccountSid(AppProperties.Channel channel) {
        return isPresent(channel.getAccountSid()) ? channel.getAccountSid() : appProperties.getIntegrations().getTwilio().getAccountSid();
    }

    private String resolveAuthToken(AppProperties.Channel channel) {
        return isPresent(channel.getAuthToken()) ? channel.getAuthToken() : appProperties.getIntegrations().getTwilio().getAuthToken();
    }

    private String ensureWhatsAppAddress(String value) {
        if (value == null || value.isBlank()) {
            return value;
        }
        return value.startsWith("whatsapp:") ? value : "whatsapp:" + value;
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }
}
