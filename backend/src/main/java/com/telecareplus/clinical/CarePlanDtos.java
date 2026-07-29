package com.telecareplus.clinical;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class CarePlanDtos {

    public record CarePlanRequest(
            @NotNull Long patientId,
            @NotNull Long doctorId,
            @NotBlank String title,
            @NotBlank String conditionName,
            @NotBlank String goals,
            String medicationGuidance,
            String lifestyleGuidance,
            String warningThresholds,
            String reviewFrequency,
            Boolean active
    ) {}

    public record CarePlanResponse(
            Long id,
            Long patientId,
            String patientName,
            Long doctorId,
            String doctorName,
            String title,
            String conditionName,
            String goals,
            String medicationGuidance,
            String lifestyleGuidance,
            String warningThresholds,
            String reviewFrequency,
            boolean active,
            LocalDateTime createdAt
    ) {}
}
