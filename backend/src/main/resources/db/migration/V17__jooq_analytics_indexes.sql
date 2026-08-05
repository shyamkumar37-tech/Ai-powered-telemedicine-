CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alert_notifications_patient_active_severity
    ON alert_notifications(patient_id, active, severity)
    WHERE active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_medication_reminders_patient_status_date
    ON medication_reminders(patient_id, status, scheduled_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_health_records_patient_recorded_at
    ON health_records(patient_id, recorded_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_triage_assessments_patient_assessed_at
    ON triage_assessments(patient_id, assessed_at DESC);
