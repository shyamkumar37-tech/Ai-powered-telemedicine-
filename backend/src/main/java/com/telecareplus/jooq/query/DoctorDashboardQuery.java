package com.telecareplus.jooq.query;

import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Component;

import static com.telecareplus.jooq.tables.Appointments.APPOINTMENTS;
import static com.telecareplus.jooq.tables.AlertNotifications.ALERT_NOTIFICATIONS;
import static com.telecareplus.jooq.tables.TriageAssessments.TRIAGE_ASSESSMENTS;

/**
 * jOOQ query component for the doctor dashboard.
 * Replaces the previous approach of loading all appointments/alerts into memory.
 */
@Component
public class DoctorDashboardQuery {

    private final DSLContext dsl;

    public DoctorDashboardQuery(DSLContext dsl) {
        this.dsl = dsl;
    }

    /** Total appointments for a doctor. */
    public int countTotalAppointments(Long doctorId) {
        return dsl.selectCount()
                .from(APPOINTMENTS)
                .where(APPOINTMENTS.DOCTOR_ID.eq(doctorId))
                .fetchOne(0, int.class);
    }

    /** Pending (BOOKED / REQUESTED / CONFIRMED) appointments for a doctor. */
    public int countPendingAppointments(Long doctorId) {
        return dsl.selectCount()
                .from(APPOINTMENTS)
                .where(APPOINTMENTS.DOCTOR_ID.eq(doctorId)
                        .and(APPOINTMENTS.STATUS.in("BOOKED", "REQUESTED", "CONFIRMED")))
                .fetchOne(0, int.class);
    }

    /** Completed appointments for a doctor. */
    public int countCompletedAppointments(Long doctorId) {
        return dsl.selectCount()
                .from(APPOINTMENTS)
                .where(APPOINTMENTS.DOCTOR_ID.eq(doctorId)
                        .and(APPOINTMENTS.STATUS.eq("COMPLETED")))
                .fetchOne(0, int.class);
    }

    /** Distinct patients seen by this doctor who currently have a CRITICAL active alert. */
    public int countPatientsWithCriticalAlerts(Long doctorId) {
        var patientIdsSub = DSL.select(APPOINTMENTS.PATIENT_ID)
                .from(APPOINTMENTS)
                .where(APPOINTMENTS.DOCTOR_ID.eq(doctorId));

        return dsl.selectCount()
                .from(ALERT_NOTIFICATIONS)
                .where(ALERT_NOTIFICATIONS.PATIENT_ID.in(patientIdsSub)
                        .and(ALERT_NOTIFICATIONS.ACTIVE.isTrue())
                        .and(ALERT_NOTIFICATIONS.SEVERITY.eq("CRITICAL")))
                .fetchOne(0, int.class);
    }

    /**
     * Number of distinct patients who have at least one triage assessment on record
     * for appointments belonging to this doctor.
     */
    public int countTriagedPatients(Long doctorId) {
        var patientIdsSub = DSL.select(APPOINTMENTS.PATIENT_ID)
                .from(APPOINTMENTS)
                .where(APPOINTMENTS.DOCTOR_ID.eq(doctorId));

        return dsl.selectCount()
                .from(DSL.selectDistinct(TRIAGE_ASSESSMENTS.PATIENT_ID)
                        .from(TRIAGE_ASSESSMENTS)
                        .where(TRIAGE_ASSESSMENTS.PATIENT_ID.in(patientIdsSub))
                        .asTable("triaged"))
                .fetchOne(0, int.class);
    }
}
