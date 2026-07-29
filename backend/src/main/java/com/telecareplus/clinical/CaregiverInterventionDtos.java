package com.telecareplus.clinical;

import com.telecareplus.users.Caregiver;

import com.telecareplus.common.AlertSeverity;
import com.telecareplus.clinical.CaregiverActionType;
import com.telecareplus.clinical.CaregiverInterventionStatus;
import com.telecareplus.clinical.WellbeingStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class CaregiverInterventionDtos {

    public record CaregiverInterventionRequest(
            @NotNull Long caregiverId,
            @NotNull Long patientId,
            Long alertNotificationId,
            @NotNull CaregiverActionType actionType,
            @NotNull WellbeingStatus wellbeingStatus,
            @NotBlank(message = "Caregiver notes are required") String notes,
            Boolean followUpNeeded
    ) {}

    public record CaregiverInterventionStatusRequest(
            @NotNull CaregiverInterventionStatus status
    ) {}

    public record CaregiverInterventionResponse(
            Long id,
            Long caregiverId,
            Long patientId,
            String patientName,
            Long alertNotificationId,
            AlertSeverity alertSeverity,
            String alertMessage,
            CaregiverActionType actionType,
            CaregiverInterventionStatus status,
            WellbeingStatus wellbeingStatus,
            String notes,
            boolean followUpNeeded,
            LocalDateTime actionAt
    ) {}
}
