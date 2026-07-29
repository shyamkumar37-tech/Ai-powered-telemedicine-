package com.telecareplus.ai;

import java.util.List;
import java.util.Optional;

public interface GenerativeAiService {

    record GeneratedReply(
            String answer,
            String urgencyLabel,
            List<String> suggestedActions,
            String provider
    ) {}

    record TranslatedText(
            String text,
            String provider,
            String sourceLanguage,
            String targetLanguage
    ) {}

    boolean isConfigured();

    Optional<GeneratedReply> generateClinicalReply(String systemPrompt, String userPrompt);

    Optional<String> generateRawText(String systemPrompt, String userPrompt);

    Optional<TranslatedText> translateText(String text, String sourceLanguage, String targetLanguage);
}
