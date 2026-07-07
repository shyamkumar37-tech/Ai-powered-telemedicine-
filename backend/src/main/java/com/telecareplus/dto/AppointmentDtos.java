package com.telecareplus.dto;

import com.telecareplus.entity.enums.AppointmentStatus;
import com.telecareplus.entity.enums.ConsultationMode;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public class AppointmentDtos {

    public record AppointmentRequest(
            @NotNull Long patientId,
            @NotNull Long doctorId,
            Long triageAssessmentId,
            @NotNull @Future LocalDateTime appointmentDateTime,
            @NotNull ConsultationMode mode,
            @Size(max = 1200, message = "Concern summary must be at most 1200 characters") String concernSummary
    ) {}

    public record AppointmentStatusRequest(@NotNull AppointmentStatus status) {}

    public record AppointmentResponse(
            Long id,
            Long patientId,
            String patientName,
            Long doctorId,
            String doctorName,
            LocalDateTime appointmentDateTime,
            AppointmentStatus status,
            ConsultationMode mode,
            String concernSummary,
            String triageLevel
    ) {}
}
