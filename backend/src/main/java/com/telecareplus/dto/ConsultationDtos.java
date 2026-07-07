package com.telecareplus.dto;

import com.telecareplus.entity.enums.ConsultationOutcome;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class ConsultationDtos {

    public record ConsultationNoteRequest(
            @NotNull Long appointmentId,
            @NotBlank String notes,
            @NotNull ConsultationOutcome outcome,
            LocalDate followUpDate
    ) {}

    public record ConsultationNoteResponse(
            Long id,
            Long appointmentId,
            String doctorName,
            String patientName,
            String notes,
            ConsultationOutcome outcome,
            LocalDate followUpDate
    ) {}
}
