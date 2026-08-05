package com.telecareplus.jooq.query;

import com.telecareplus.jooq.dto.PatientRiskSummary;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Component;

import java.util.List;

import static com.telecareplus.jooq.tables.Appointments.APPOINTMENTS;
import static com.telecareplus.jooq.tables.AlertNotifications.ALERT_NOTIFICATIONS;
import static com.telecareplus.jooq.tables.TriageAssessments.TRIAGE_ASSESSMENTS;
import static com.telecareplus.jooq.tables.MedicationReminders.MEDICATION_REMINDERS;

/**
 * jOOQ query component that fetches all the data needed for the doctor's
 * priority queue in a small number of set-based queries, replacing the
 * previous per-patient JPA loop in IntelligenceServiceImpl.
 */
@Component
public class PriorityQueueQuery {

    private final DSLContext dsl;

    public PriorityQueueQuery(DSLContext dsl) {
        this.dsl = dsl;
    }

    /**
     * Returns one {@link PatientRiskSummary} per distinct patient who has an
     * appointment with this doctor. All aggregates (triage level, alert count,
     * missed reminders) are resolved in SQL — no per-patient N+1 round-trips.
     */
    public List<PatientRiskSummary> getPatientRiskSummaries(Long doctorId) {

        // Subquery: distinct patient IDs for this doctor
        var patientIds = DSL.selectDistinct(APPOINTMENTS.PATIENT_ID)
                .from(APPOINTMENTS)
                .where(APPOINTMENTS.DOCTOR_ID.eq(doctorId));

        // Latest triage level per patient (latest row by assessed_at)
        var latestTriage = DSL.select(
                        TRIAGE_ASSESSMENTS.PATIENT_ID,
                        TRIAGE_ASSESSMENTS.LEVEL)
                .from(TRIAGE_ASSESSMENTS)
                .where(TRIAGE_ASSESSMENTS.PATIENT_ID.in(patientIds))
                .and(TRIAGE_ASSESSMENTS.ASSESSED_AT.eq(
                        DSL.select(DSL.max(TRIAGE_ASSESSMENTS.ASSESSED_AT))
                                .from(TRIAGE_ASSESSMENTS.as("t2"))
                                .where(TRIAGE_ASSESSMENTS.as("t2").PATIENT_ID
                                        .eq(TRIAGE_ASSESSMENTS.PATIENT_ID))))
                .asTable("latest_triage");

        // Active alert aggregates per patient
        var alertAgg = DSL.select(
                        ALERT_NOTIFICATIONS.PATIENT_ID,
                        DSL.count().as("alert_count"),
                        DSL.max(ALERT_NOTIFICATIONS.SEVERITY).as("max_severity"),
                        DSL.max(ALERT_NOTIFICATIONS.MESSAGE).as("latest_message"))
                .from(ALERT_NOTIFICATIONS)
                .where(ALERT_NOTIFICATIONS.PATIENT_ID.in(patientIds)
                        .and(ALERT_NOTIFICATIONS.ACTIVE.isTrue()))
                .groupBy(ALERT_NOTIFICATIONS.PATIENT_ID)
                .asTable("alert_agg");

        // Missed reminder count per patient
        var missedAgg = DSL.select(
                        MEDICATION_REMINDERS.PATIENT_ID,
                        DSL.count().as("missed_count"))
                .from(MEDICATION_REMINDERS)
                .where(MEDICATION_REMINDERS.PATIENT_ID.in(patientIds)
                        .and(MEDICATION_REMINDERS.STATUS.eq("MISSED")))
                .groupBy(MEDICATION_REMINDERS.PATIENT_ID)
                .asTable("missed_agg");

        // Main query: one row per distinct patient
        return dsl.select(
                        DSL.field("patients.patient_id", Long.class),
                        DSL.field("latest_triage.level", String.class),
                        DSL.coalesce(DSL.field("alert_agg.alert_count", Integer.class), 0).as("alert_count"),
                        DSL.field("alert_agg.max_severity", String.class),
                        DSL.field("alert_agg.latest_message", String.class),
                        DSL.coalesce(DSL.field("missed_agg.missed_count", Integer.class), 0).as("missed_count"))
                .from(patientIds.asTable("patients"))
                .leftJoin(latestTriage)
                        .on(DSL.field("latest_triage.patient_id", Long.class)
                                .eq(DSL.field("patients.patient_id", Long.class)))
                .leftJoin(alertAgg)
                        .on(DSL.field("alert_agg.patient_id", Long.class)
                                .eq(DSL.field("patients.patient_id", Long.class)))
                .leftJoin(missedAgg)
                        .on(DSL.field("missed_agg.patient_id", Long.class)
                                .eq(DSL.field("patients.patient_id", Long.class)))
                .fetch(r -> new PatientRiskSummary(
                        r.get("patients.patient_id", Long.class),
                        r.get("latest_triage.level", String.class),
                        r.get("alert_agg.alert_count", int.class),
                        r.get("alert_agg.max_severity", String.class),
                        r.get("alert_agg.latest_message", String.class),
                        r.get("missed_agg.missed_count", int.class)));
    }
}
