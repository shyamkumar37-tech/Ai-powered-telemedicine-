CREATE INDEX IF NOT EXISTS idx_medication_reminder_patient_scheduled_date
ON medication_reminder (patient_id, scheduled_date DESC);

CREATE INDEX IF NOT EXISTS idx_medication_reminder_patient_status
ON medication_reminder (patient_id, status);

CREATE INDEX IF NOT EXISTS idx_health_record_patient_recorded_desc
ON health_record (patient_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_triage_assessment_patient_assessed
ON triage_assessment (patient_id, assessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_consultation_note_patient_created
ON consultation_note (patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_notification_patient_active_created
ON alert_notification (patient_id, active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_care_plan_patient_active
ON care_plan (patient_id, active);
