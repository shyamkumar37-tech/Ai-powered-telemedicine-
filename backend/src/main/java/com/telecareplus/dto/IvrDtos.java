package com.telecareplus.dto;

import com.telecareplus.entity.enums.ConsultationMode;
import com.telecareplus.entity.enums.IvrServiceType;
import com.telecareplus.entity.enums.IvrSessionStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

public class IvrDtos {

    public record StartSessionRequest(
            @NotNull Long patientId,
            @NotBlank String phoneNumber,
            @NotBlank String languageCode,
            @NotNull IvrServiceType serviceType,
            LocalDateTime appointmentDateTime,
            ConsultationMode mode,
            String concernSummary
    ) {}

    public record SessionResponse(
            Long id,
            Long patientId,
            String patientName,
            String phoneNumber,
            String languageCode,
            IvrServiceType serviceType,
            IvrSessionStatus status,
            Long appointmentId,
            String doctorName,
            String transcriptSummary,
            List<String> prompts,
            LocalDateTime createdAt
    ) {}
}
