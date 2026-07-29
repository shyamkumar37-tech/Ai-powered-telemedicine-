package com.telecareplus.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

public class ChatbotDtos {

    public record ChatRequest(
            @NotNull Long patientId,
            @NotBlank String question
    ) {}

    public record ChatResponse(
            Long id,
            String question,
            String answer,
            String urgencyLabel,
            List<String> suggestedActions,
            LocalDateTime createdAt
    ) {}
}
