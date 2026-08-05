package com.telecareplus.jooq.dto;

/**
 * Simple DTO holding analytics counts for a patient dashboard.
 */
public record DashboardAnalyticsData(
        int appointmentCount,
        int prescriptionCount,
        int medicationReminderCount,
        int activeAlertCount) {
}
