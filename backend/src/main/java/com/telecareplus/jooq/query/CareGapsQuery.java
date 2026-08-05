package com.telecareplus.jooq.query;

import static com.telecareplus.jooq.Tables.ALERT_NOTIFICATIONS;
import static com.telecareplus.jooq.Tables.HEALTH_RECORDS;
import static com.telecareplus.jooq.Tables.MEDICATION_REMINDERS;
import static com.telecareplus.jooq.Tables.PATIENTS;
import static com.telecareplus.jooq.Tables.PATIENT_CAREGIVER_LINK;
import static com.telecareplus.jooq.Tables.USERS;
import static org.jooq.impl.DSL.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Component;

@Component
public class CareGapsQuery {

    private final DSLContext dsl;

    public CareGapsQuery(DSLContext dsl) {
        this.dsl = dsl;
    }

    public List<CareGapPatientSummary> getCaregiverPatientGaps(Long caregiverId) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        var records = dsl.select(
                PATIENTS.ID,
                USERS.FULL_NAME,
                field(
                    select(count())
                    .from(MEDICATION_REMINDERS)
                    .where(MEDICATION_REMINDERS.PATIENT_ID.eq(PATIENTS.ID)
                      .and(MEDICATION_REMINDERS.STATUS.eq("MISSED")
                           .or(MEDICATION_REMINDERS.STATUS.eq("PENDING").and(MEDICATION_REMINDERS.SCHEDULED_DATE.lt(startOfDay)))))
                ).as("missed_count"),
                field(
                    select(count())
                    .from(select(HEALTH_RECORDS.ID).from(HEALTH_RECORDS).where(HEALTH_RECORDS.PATIENT_ID.eq(PATIENTS.ID)).orderBy(HEALTH_RECORDS.RECORDED_AT.desc()).limit(10).asTable("hr"))
                ).as("recent_readings"),
                field(
                    select(count())
                    .from(ALERT_NOTIFICATIONS)
                    .where(ALERT_NOTIFICATIONS.PATIENT_ID.eq(PATIENTS.ID)
                      .and(ALERT_NOTIFICATIONS.ACTIVE.isTrue())
                      .and(ALERT_NOTIFICATIONS.SEVERITY.eq("CRITICAL")))
                ).as("critical_alerts")
            )
            .from(PATIENT_CAREGIVER_LINK)
            .join(PATIENTS).on(PATIENTS.ID.eq(PATIENT_CAREGIVER_LINK.PATIENT_ID))
            .join(USERS).on(USERS.ID.eq(PATIENTS.USER_ID))
            .where(PATIENT_CAREGIVER_LINK.CAREGIVER_ID.eq(caregiverId).and(PATIENT_CAREGIVER_LINK.ACTIVE.isTrue()))
            .fetch();

        return records.map(r -> new CareGapPatientSummary(
            r.get(PATIENTS.ID),
            r.get(USERS.FULL_NAME),
            r.get("missed_count", Long.class) != null ? r.get("missed_count", Long.class) : 0L,
            r.get("recent_readings", Long.class) != null ? r.get("recent_readings", Long.class) : 0L,
            r.get("critical_alerts", Long.class) != null && r.get("critical_alerts", Long.class) > 0
        ));
    }

    public record CareGapPatientSummary(
        Long patientId,
        String patientName,
        long missedCount,
        long recentReadings,
        boolean hasCriticalAlerts
    ) {}
}
