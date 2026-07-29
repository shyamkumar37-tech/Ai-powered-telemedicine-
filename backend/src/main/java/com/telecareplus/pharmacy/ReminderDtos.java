package com.telecareplus.pharmacy;

import com.telecareplus.pharmacy.ReminderStatus;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class ReminderDtos {

    public record ReminderStatusRequest(@NotNull ReminderStatus status) {}

    public record ReminderResponse(
            Long id,
            String medicineName,
            String dosage,
            String frequency,
            LocalDate scheduledDate,
            ReminderStatus status
    ) {}

    public record AdherenceSummaryResponse(
            long total,
            long taken,
            long missed,
            double adherencePercentage
    ) {}
}
