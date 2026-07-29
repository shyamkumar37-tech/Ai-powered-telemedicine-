package com.telecareplus.clinical;

import com.telecareplus.clinical.TriageLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class TriageDtos {

    public record TriageRequest(
            @NotNull Long patientId,
            @NotBlank String symptoms,
            Integer symptomDurationDays,
            Boolean chestPain,
            Boolean severeBreathlessness,
            Boolean fainting,
            Double oxygenLevel,
            Double temperature,
            Boolean persistentHighFever
    ) {}

    public record TriageResponse(
            Long id,
            TriageLevel level,
            String recommendation,
            String symptoms,
            LocalDateTime assessedAt
    ) {}
}
