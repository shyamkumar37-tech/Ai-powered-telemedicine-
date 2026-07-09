package com.telecareplus.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public class CaregiverDtos {

    public record CaregiverLinkRequest(@NotNull Long patientId, @NotNull Long caregiverId) {}

    public record LinkedPatientResponse(
            Long patientId,
            String patientName,
            long pendingReminders,
            double adherencePercentage,
            List<String> activeAlerts
    ) {}

    public record CaregiverInviteRequest(
            @NotNull Long patientId,
            @NotNull String email,
            @NotNull String relationship
    ) {}
}
