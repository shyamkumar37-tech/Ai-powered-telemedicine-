package com.telecareplus.jooq.query;

import static com.telecareplus.jooq.Tables.MEDICATION_REMINDERS;

import java.time.LocalDate;
import java.time.LocalDateTime;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Component;

@Component
public class MedicationAdherenceQuery {

    private final DSLContext dsl;

    public MedicationAdherenceQuery(DSLContext dsl) {
        this.dsl = dsl;
    }

    public AdherenceCounts getAdherenceCounts(Long patientId, LocalDate today) {
        LocalDateTime startOfDay = today.atStartOfDay();
        var result = dsl.select(
                    DSL.sum(DSL.when(MEDICATION_REMINDERS.STATUS.eq("TAKEN"), 1).otherwise(0)).as("taken"),
                    DSL.sum(DSL.when(
                        MEDICATION_REMINDERS.STATUS.eq("MISSED").or(
                            MEDICATION_REMINDERS.STATUS.eq("PENDING").and(MEDICATION_REMINDERS.SCHEDULED_DATE.lt(startOfDay))
                        ), 1).otherwise(0)).as("missed")
                )
                .from(MEDICATION_REMINDERS)
                .where(MEDICATION_REMINDERS.PATIENT_ID.eq(patientId))
                .fetchOne();

        long taken = result != null && result.get("taken") != null ? result.get("taken", Long.class) : 0L;
        long missed = result != null && result.get("missed") != null ? result.get("missed", Long.class) : 0L;

        return new AdherenceCounts(taken, missed);
    }

    public record AdherenceCounts(long taken, long missed) {
        public long getTaken() { return taken; }
        public long getMissed() { return missed; }
    }
}
