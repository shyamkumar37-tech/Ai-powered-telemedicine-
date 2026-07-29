package com.telecareplus.appointments;

import com.telecareplus.common.ConsultationMode;
import com.telecareplus.appointments.IvrServiceType;
import com.telecareplus.appointments.IvrSessionStatus;
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
