package com.telecareplus.event;

import java.time.LocalDate;

public record MedicationMissedEvent(
        Long patientId,
        Long reminderId,
        String medicationName,
        LocalDate scheduledDate
) {}
