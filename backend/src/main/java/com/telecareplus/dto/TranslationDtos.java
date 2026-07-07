package com.telecareplus.dto;

public final class TranslationDtos {

    private TranslationDtos() {
    }

    public record TranslateRequest(
            String text,
            String targetLanguage,
            String sourceLanguage
    ) {}

    public record TranslateResponse(
            String text,
            String provider,
            boolean translated,
            String sourceLanguage,
            String targetLanguage
    ) {}
}
