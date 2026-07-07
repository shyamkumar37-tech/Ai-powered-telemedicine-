package com.telecareplus.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

public class PrescriptionDtos {

    public record MedicationItemRequest(
            @NotBlank String medicineName,
            @NotBlank String dosage,
            @NotBlank String frequency,
            @NotNull @Min(1) Integer durationDays,
            String notes
    ) {}

    public record PrescriptionRequest(
            @NotNull Long consultationNoteId,
            String patientDisplayName,
            String notes,
            LocalDate followUpDate,
            @Valid @NotEmpty List<MedicationItemRequest> medications
    ) {}

    public record MedicationItemResponse(
            Long id,
            String medicineName,
            String dosage,
            String frequency,
            Integer durationDays,
            String notes
    ) {}

    public record PrescriptionResponse(
            Long id,
            Long patientId,
            String patientName,
            String doctorName,
            String notes,
            LocalDate followUpDate,
            List<MedicationItemResponse> medications
    ) {}
}
