package com.telecareplus.common;

import java.time.LocalDateTime;

public record VitalLoggedEvent(
        Long patientId,
        String vitalType,
        String value,
        String unit,
        LocalDateTime timestamp,
        boolean isCritical
) {}
