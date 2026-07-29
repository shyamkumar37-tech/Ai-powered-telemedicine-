package com.telecareplus.common;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Locale;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class HfInferenceClient {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${telecare.hf.enabled:false}")
    private boolean enabled;

    @Value("${telecare.hf.apiKey:}")
    private String apiKey;

    @Value("${telecare.hf.baseUrl:https://api-inference.huggingface.co/models}")
    private String baseUrl;

    @Value("${telecare.hf.chatModel:}")
    private String chatModel;

    @Value("${telecare.hf.translationModel:}")
    private String translationModel;

    @Value("${telecare.hf.sentimentModel:}")
    private String sentimentModel;

    @Value("${telecare.hf.timeoutSeconds:20}")
    private int timeoutSeconds;

    public boolean isEnabled() {
        return enabled && apiKey != null && !apiKey.isBlank();
    }

    public Optional<String> generateChat(String prompt) {
        if (!isEnabled() || chatModel == null || chatModel.isBlank()) {
            return Optional.empty();
        }
        return requestModel(chatModel, prompt);
    }

    public Optional<String> translate(String text, String sourceLanguage, String targetLanguage) {
        if (!isEnabled() || translationModel == null || translationModel.isBlank()) {
            return Optional.empty();
        }
        String prompt = "Translate from " + normalizeLanguage(sourceLanguage)
                + " to " + normalizeLanguage(targetLanguage)
                + ". Keep medical terms accurate. Return only the translation."
                + System.lineSeparator()
                + text;
        return requestModel(translationModel, prompt);
    }

    public Optional<SentimentResult> analyzeSentiment(String text) {
        if (!isEnabled() || sentimentModel == null || sentimentModel.isBlank() || text == null || text.isBlank()) {
            return Optional.empty();
        }
        Optional<JsonNode> raw = requestModelJson(sentimentModel, text);
        if (raw.isEmpty()) {
            return Optional.empty();
        }
        JsonNode node = raw.get();
        JsonNode top = node.isArray() && node.size() > 0 ? node.get(0) : node;
        if (top.isArray() && top.size() > 0) {
            top = top.get(0);
        }
        String label = top.path("label").asText("");
        double score = top.path("score").asDouble(0.0);
        if (label.isBlank()) {
            return Optional.empty();
        }
        return Optional.of(new SentimentResult(normalizeLabel(label), score));
    }

    private Optional<String> requestModel(String model, String input) {
        Optional<JsonNode> response = requestModelJson(model, input);
        if (response.isEmpty()) {
            return Optional.empty();
        }
        JsonNode node = response.get();
        if (node.isArray() && node.size() > 0) {
            JsonNode first = node.get(0);
            String text = first.path("generated_text").asText(null);
            if (text == null) {
                text = first.path("translation_text").asText(null);
            }
            return Optional.ofNullable(text);
        }
        String single = node.path("generated_text").asText(null);
        if (single == null) {
            single = node.path("translation_text").asText(null);
        }
        return Optional.ofNullable(single);
    }

    private Optional<JsonNode> requestModelJson(String model, String input) {
        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("inputs", input);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(normalizeBaseUrl() + "/" + model))
                    .timeout(Duration.ofSeconds(Math.max(5, timeoutSeconds)))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                log.warn("Hugging Face inference returned HTTP {}", response.statusCode());
                return Optional.empty();
            }
            return Optional.of(objectMapper.readTree(response.body()));
        } catch (Exception ex) {
            log.warn("Hugging Face inference failed: {}", ex.getMessage());
            return Optional.empty();
        }
    }

    private String normalizeBaseUrl() {
        if (baseUrl == null || baseUrl.isBlank()) {
            return "https://api-inference.huggingface.co/models";
        }
        String trimmed = baseUrl.trim();
        return trimmed.endsWith("/") ? trimmed.substring(0, trimmed.length() - 1) : trimmed;
    }

    private String normalizeLanguage(String language) {
        if (language == null || language.isBlank()) {
            return "auto";
        }
        return language.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeLabel(String label) {
        String value = label.trim().toLowerCase(Locale.ROOT);
        if (value.contains("neg")) {
            return "negative";
        }
        if (value.contains("pos")) {
            return "positive";
        }
        if (value.contains("neutral")) {
            return "neutral";
        }
        return value;
    }

    public record SentimentResult(String label, double score) {}
}
