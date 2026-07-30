package com.telecareplus.ai;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Pattern;

/**
 * AI Security Guard for Prompt Injection & Jailbreak Defense.
 * Mitigates OWASP Top 10 for LLM Applications (LLM01: Prompt Injection & LLM06: Sensitive Information Disclosure).
 */
@Component
public class AiSecurityGuard {

    private static final List<Pattern> INJECTION_PATTERNS = List.of(
            Pattern.compile("ignore (all|previous) instructions", Pattern.CASE_INSENSITIVE),
            Pattern.compile("disregard system prompt", Pattern.CASE_INSENSITIVE),
            Pattern.compile("you are now DAN", Pattern.CASE_INSENSITIVE),
            Pattern.compile("reveal your system prompt", Pattern.CASE_INSENSITIVE),
            Pattern.compile("<script>|javascript:", Pattern.CASE_INSENSITIVE)
    );

    /**
     * Sanitizes and validates incoming user prompts to prevent injection attacks.
     *
     * @param userPrompt The raw user prompt
     * @return Validated prompt string
     * @throws IllegalArgumentException if prompt injection is detected
     */
    public String validateAndSanitizePrompt(String userPrompt) {
        if (userPrompt == null || userPrompt.isBlank()) {
            return userPrompt;
        }

        for (Pattern pattern : INJECTION_PATTERNS) {
            if (pattern.matcher(userPrompt).find()) {
                throw new IllegalArgumentException("Security Exception: Malicious prompt injection pattern detected.");
            }
        }

        return userPrompt.trim();
    }
}
