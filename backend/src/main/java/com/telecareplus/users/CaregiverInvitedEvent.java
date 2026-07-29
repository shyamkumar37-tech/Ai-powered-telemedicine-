package com.telecareplus.users;

import lombok.Builder;

@Builder
public record CaregiverInvitedEvent(
    Long patientId,
    String patientName,
    String caregiverEmail,
    String relationship,
    String inviteLink
) {}
