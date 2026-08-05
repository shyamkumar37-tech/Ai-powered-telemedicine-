package com.telecareplus.jooq.dto;

/**
 * Lightweight DTO carrying per-patient risk data returned by {@link com.telecareplus.jooq.query.PriorityQueueQuery}.
 *
 * @param patientId      the patient's primary key
 * @param latestTriageLevel the most recent triage level name (may be null if no triage exists)
 * @param activeCriticalAlertCount number of currently active alerts for this patient
 * @param latestAlertSeverity severity of the most recent active alert (may be null)
 * @param latestAlertMessage message of the most recent active alert (may be null)
 * @param missedReminderCount number of medication reminders with status MISSED
 */
public record PatientRiskSummary(
        Long patientId,
        String latestTriageLevel,
        int activeCriticalAlertCount,
        String latestAlertSeverity,
        String latestAlertMessage,
        int missedReminderCount
) {}
