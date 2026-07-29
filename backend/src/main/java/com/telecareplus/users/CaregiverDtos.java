package com.telecareplus.users;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public class CaregiverDtos {

    public record CaregiverLinkRequest(@NotNull Long patientId, @NotNull Long caregiverId) {}

    public record LinkedPatientResponse(
            Long patientId,
            String patientName
    ) {}

    public record CaregiverInviteRequest(
            @NotNull Long patientId,
            @NotNull String email,
            @NotNull String relationship
    ) {}
}
