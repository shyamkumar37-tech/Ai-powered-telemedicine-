package com.telecareplus.jooq.query;

import com.telecareplus.jooq.dto.DashboardAnalyticsData;
import org.jooq.DSLContext;
import org.springframework.stereotype.Component;

import static com.telecareplus.jooq.tables.Appointments.APPOINTMENTS;
import static com.telecareplus.jooq.tables.Prescriptions.PRESCRIPTIONS;
import static com.telecareplus.jooq.tables.MedicationReminders.MEDICATION_REMINDERS;
import static com.telecareplus.jooq.tables.AlertNotifications.ALERT_NOTIFICATIONS;

/**
 * Query component that provides analytics data for the patient dashboard.
 * Uses jOOQ generated tables to perform efficient SQL count queries.
 */
@Component
public class DashboardAnalyticsQuery {

    private final DSLContext dsl;

    public DashboardAnalyticsQuery(DSLContext dsl) {
        this.dsl = dsl;
    }

    /**
     * Retrieves various count metrics for the given patient.
     *
     * @param patientId the patient identifier
     * @return a {@link DashboardAnalyticsData} DTO containing the counts
     */
    public DashboardAnalyticsData getPatientMetrics(Long patientId) {
        int appointmentCount = dsl.selectCount()
                .from(APPOINTMENTS)
                .where(APPOINTMENTS.PATIENT_ID.eq(patientId))
                .fetchOne(0, int.class);

        int prescriptionCount = dsl.selectCount()
                .from(PRESCRIPTIONS)
                .where(PRESCRIPTIONS.PATIENT_ID.eq(patientId))
                .fetchOne(0, int.class);

        int medicationReminderCount = dsl.selectCount()
                .from(MEDICATION_REMINDERS)
                .where(MEDICATION_REMINDERS.PATIENT_ID.eq(patientId))
                .fetchOne(0, int.class);

        int activeAlertCount = dsl.selectCount()
                .from(ALERT_NOTIFICATIONS)
                .where(ALERT_NOTIFICATIONS.PATIENT_ID.eq(patientId)
                        .and(ALERT_NOTIFICATIONS.ACTIVE.isTrue()))
                .fetchOne(0, int.class);

        return new DashboardAnalyticsData(appointmentCount, prescriptionCount, medicationReminderCount, activeAlertCount);
    }
}
