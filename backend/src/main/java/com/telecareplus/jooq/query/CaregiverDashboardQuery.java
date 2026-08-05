package com.telecareplus.jooq.query;

import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Component;

import static com.telecareplus.jooq.tables.Appointments.APPOINTMENTS;
import static com.telecareplus.jooq.tables.MedicationReminders.MEDICATION_REMINDERS;
import static com.telecareplus.jooq.tables.PatientCaregiverLink.PATIENT_CAREGIVER_LINK;

/**
 * jOOQ query component for the caregiver dashboard.
 * Replaces per-patient N+1 JPA loops with single, set-based SQL queries.
 */
@Component
public class CaregiverDashboardQuery {

    private final DSLContext dsl;

    public CaregiverDashboardQuery(DSLContext dsl) {
        this.dsl = dsl;
    }

    /** Total appointments across all patients linked to this caregiver. */
    public int countLinkedPatientAppointments(Long caregiverId) {
        var linkedPatientIds = DSL.select(PATIENT_CAREGIVER_LINK.PATIENT_ID)
                .from(PATIENT_CAREGIVER_LINK)
                .where(PATIENT_CAREGIVER_LINK.CAREGIVER_ID.eq(caregiverId)
                        .and(PATIENT_CAREGIVER_LINK.ACTIVE.isTrue()));

        return dsl.selectCount()
                .from(APPOINTMENTS)
                .where(APPOINTMENTS.PATIENT_ID.in(linkedPatientIds))
                .fetchOne(0, int.class);
    }

    /** Total PENDING medication reminders across all patients linked to this caregiver. */
    public int countPendingReminders(Long caregiverId) {
        var linkedPatientIds = DSL.select(PATIENT_CAREGIVER_LINK.PATIENT_ID)
                .from(PATIENT_CAREGIVER_LINK)
                .where(PATIENT_CAREGIVER_LINK.CAREGIVER_ID.eq(caregiverId)
                        .and(PATIENT_CAREGIVER_LINK.ACTIVE.isTrue()));

        return dsl.selectCount()
                .from(MEDICATION_REMINDERS)
                .where(MEDICATION_REMINDERS.PATIENT_ID.in(linkedPatientIds)
                        .and(MEDICATION_REMINDERS.STATUS.eq("PENDING")))
                .fetchOne(0, int.class);
    }

    /** Number of distinct patients linked to this caregiver. */
    public int countLinkedPatients(Long caregiverId) {
        return dsl.selectCount()
                .from(PATIENT_CAREGIVER_LINK)
                .where(PATIENT_CAREGIVER_LINK.CAREGIVER_ID.eq(caregiverId)
                        .and(PATIENT_CAREGIVER_LINK.ACTIVE.isTrue()))
                .fetchOne(0, int.class);
    }
}
