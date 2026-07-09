package com.telecareplus.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.telecareplus.config.AppProperties;
import com.telecareplus.service.GenerativeAiService;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class GenerativeAiServiceImpl implements GenerativeAiService {

    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Override
    public boolean isConfigured() {
        AppProperties.Ai ai = appProperties.getAi();
        if (ai == null || !ai.isEnabled()) {
            return false;
        }
        if (ai.getProvider() == null || ai.getProvider().isBlank() || "local".equalsIgnoreCase(ai.getProvider())) {
            return false;
        }
        return ai.getModel() != null && !ai.getModel().isBlank();
    }

    @Override
    public Optional<GeneratedReply> generateClinicalReply(String systemPrompt, String userPrompt) {
        if (!isConfigured()) {
            return Optional.empty();
        }

        Optional<String> generatedText = generateRawText(systemPrompt, userPrompt);
        return generatedText.flatMap((content) -> parseGeneratedReply(content, currentProviderName()));
    }

    @Override
    public Optional<TranslatedText> translateText(String text, String sourceLanguage, String targetLanguage) {
        if (!isConfigured() || text == null || text.isBlank()) {
            return Optional.empty();
        }

        String normalizedSource = normalizeLanguageTag(sourceLanguage);
        String normalizedTarget = normalizeLanguageTag(targetLanguage);
        if (normalizedTarget == null || normalizedTarget.isBlank() || normalizedTarget.equalsIgnoreCase(normalizedSource)) {
            return Optional.empty();
        }

        String systemPrompt = """
                You are TeleCare+, a careful clinical translation assistant.
                Translate the supplied medical or continuity-care text into the requested target language.
                Keep clinical meaning, medicine names, measurements, and dosage values accurate.
                Do not add advice, do not summarize, and do not explain.
                Return only the translated text with no markdown and no surrounding quotes.
                """;

        String userPrompt = "Source language: " + normalizedSource
                + System.lineSeparator()
                + "Target language: " + normalizedTarget
                + System.lineSeparator()
                + "Text:"
                + System.lineSeparator()
                + text;

        return generateRawText(systemPrompt, userPrompt)
                .map(String::trim)
                .filter((value) -> !value.isBlank())
                .map((value) -> new TranslatedText(value, currentProviderName(), normalizedSource, normalizedTarget));
    }

    @Override
    public Optional<String> generateRawText(String systemPrompt, String userPrompt) {
        if (!isConfigured()) {
            return Optional.empty();
        }

        AppProperties.Ai ai = appProperties.getAi();
        try {
            return switch (ai.getProvider().toLowerCase(Locale.ROOT)) {
                case "openai", "openai-compatible", "openrouter", "groq" -> requestOpenAiCompatibleText(ai, systemPrompt, userPrompt);
                case "gemini", "google", "google-gemini" -> requestGeminiText(ai, systemPrompt, userPrompt);
                case "ollama" -> requestOllamaText(ai, systemPrompt, userPrompt);
                default -> {
                    log.warn("TeleCare+ AI provider '{}' is not supported. Falling back to local guidance.", ai.getProvider());
                    yield Optional.empty();
                }
            };
        } catch (Exception ex) {
            log.warn("TeleCare+ AI provider call failed, using local guidance instead: {}", ex.getMessage());
            return Optional.empty();
        }
    }

    private String currentProviderName() {
        return appProperties.getAi() == null || appProperties.getAi().getProvider() == null
                ? "local"
                : appProperties.getAi().getProvider();
    }

    private Optional<String> requestOpenAiCompatibleText(AppProperties.Ai ai, String systemPrompt, String userPrompt)
            throws IOException, InterruptedException {
        if (ai.getApiKey() == null || ai.getApiKey().isBlank()) {
            return Optional.empty();
        }

        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", ai.getModel());
        body.put("temperature", ai.getTemperature());

        ArrayNode messages = body.putArray("messages");
        messages.addObject()
                .put("role", "system")
                .put("content", systemPrompt);
        messages.addObject()
                .put("role", "user")
                .put("content", userPrompt);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(normalizeBaseUrl(ai.getApiBaseUrl()) + "/v1/chat/completions"))
                .timeout(Duration.ofSeconds(Math.max(5, ai.getTimeoutSeconds())))
                .header("Authorization", "Bearer " + ai.getApiKey())
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            log.warn("TeleCare+ AI provider returned HTTP {}", response.statusCode());
            return Optional.empty();
        }

        JsonNode root = objectMapper.readTree(response.body());
        String content = root.path("choices").path(0).path("message").path("content").asText(null);
        return Optional.ofNullable(content);
    }

    private Optional<String> requestGeminiText(AppProperties.Ai ai, String systemPrompt, String userPrompt)
            throws IOException, InterruptedException {
        if (ai.getApiKey() == null || ai.getApiKey().isBlank()) {
            return Optional.empty();
        }

        ObjectNode body = objectMapper.createObjectNode();
        body.set("system_instruction", textPartsNode(systemPrompt));

        ArrayNode contents = body.putArray("contents");
        contents.addObject()
                .put("role", "user")
                .set("parts", textPartsArray(userPrompt));

        ObjectNode generationConfig = body.putObject("generationConfig");
        generationConfig.put("temperature", ai.getTemperature());

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(normalizeBaseUrl(ai.getApiBaseUrl())
                        + "/v1beta/models/" + ai.getModel() + ":generateContent"))
                .timeout(Duration.ofSeconds(Math.max(5, ai.getTimeoutSeconds())))
                .header("x-goog-api-key", ai.getApiKey())
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            log.warn("TeleCare+ Gemini call returned HTTP {} with body: {}", response.statusCode(), response.body());
            return Optional.empty();
        }

        JsonNode root = objectMapper.readTree(response.body());
        String content = root.path("candidates").path(0).path("content").path("parts").path(0).path("text").asText(null);
        return Optional.ofNullable(content);
    }

    private Optional<String> requestOllamaText(AppProperties.Ai ai, String systemPrompt, String userPrompt)
            throws IOException, InterruptedException {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", ai.getModel());
        body.put("stream", false);

        ArrayNode messages = body.putArray("messages");
        messages.addObject()
                .put("role", "system")
                .put("content", systemPrompt);
        messages.addObject()
                .put("role", "user")
                .put("content", userPrompt);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(normalizeBaseUrl(ai.getApiBaseUrl()) + "/api/chat"))
                .timeout(Duration.ofSeconds(Math.max(5, ai.getTimeoutSeconds())))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            log.warn("TeleCare+ Ollama call returned HTTP {}", response.statusCode());
            return Optional.empty();
        }

        JsonNode root = objectMapper.readTree(response.body());
        String content = root.path("message").path("content").asText(null);
        return Optional.ofNullable(content);
    }

    private Optional<GeneratedReply> parseGeneratedReply(String rawContent, String provider) {
        if (rawContent == null || rawContent.isBlank()) {
            return Optional.empty();
        }

        String content = sanitizeJsonPayload(rawContent);
        try {
            JsonNode root = objectMapper.readTree(content);
            String answer = firstNonBlank(
                    root.path("answer").asText(null),
                    root.path("response").asText(null),
                    root.path("message").asText(null)
            );
            String urgency = normalizeUrgency(firstNonBlank(
                    root.path("urgencyLabel").asText(null),
                    root.path("urgency").asText(null)
            ));
            List<String> actions = parseActions(root.path("suggestedActions"));

            if (answer == null || answer.isBlank()) {
                return Optional.empty();
            }

            return Optional.of(new GeneratedReply(answer.trim(), urgency, actions, provider));
        } catch (Exception ex) {
            String cleaned = rawContent.trim();
            if (!cleaned.isBlank()) {
                return Optional.of(new GeneratedReply(cleaned, "ROUTINE", List.of(), provider));
            }
            return Optional.empty();
        }
    }

    private List<String> parseActions(JsonNode node) {
        List<String> actions = new ArrayList<>();
        if (node == null || node.isMissingNode() || node.isNull()) {
            return actions;
        }
        if (node.isArray()) {
            node.forEach(item -> {
                String value = item.asText("").trim();
                if (!value.isBlank()) {
                    actions.add(value);
                }
            });
        } else if (node.isTextual()) {
            String text = node.asText("");
            for (String item : text.split("\\r?\\n|\\|\\|")) {
                String value = item.replaceFirst("^[-*\\d.\\s]+", "").trim();
                if (!value.isBlank()) {
                    actions.add(value);
                }
            }
        }
        return actions.stream().distinct().limit(4).toList();
    }

    private String sanitizeJsonPayload(String rawContent) {
        String content = rawContent.trim();
        if (content.startsWith("```")) {
            content = content.replaceFirst("^```(?:json)?", "").replaceFirst("```$", "").trim();
        }
        return content;
    }

    private ObjectNode textPartsNode(String text) {
        ObjectNode node = objectMapper.createObjectNode();
        node.set("parts", textPartsArray(text));
        return node;
    }

    private ArrayNode textPartsArray(String text) {
        ArrayNode parts = objectMapper.createArrayNode();
        parts.addObject().put("text", text);
        return parts;
    }

    private String normalizeBaseUrl(String apiBaseUrl) {
        String base = apiBaseUrl == null || apiBaseUrl.isBlank() ? "http://localhost:11434" : apiBaseUrl.trim();
        return base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
    }

    private String normalizeLanguageTag(String language) {
        if (language == null || language.isBlank()) {
            return "auto";
        }

        return switch (language.trim().toLowerCase(Locale.ROOT)) {
            case "auto", "detect" -> "auto";
            case "en", "english" -> "en";
            case "hi", "hindi" -> "hi";
            case "ml", "malayalam" -> "ml";
            case "te", "telugu" -> "te";
            case "pa", "punjabi" -> "pa";
            case "ta", "tamil" -> "ta";
            default -> language.trim().toLowerCase(Locale.ROOT);
        };
    }

    private String normalizeUrgency(String urgency) {
        if (urgency == null || urgency.isBlank()) {
            return "ROUTINE";
        }
        String value = urgency.trim().toUpperCase(Locale.ROOT);
        return switch (value) {
            case "CRITICAL", "WARNING", "ROUTINE" -> value;
            default -> "ROUTINE";
        };
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }
}
