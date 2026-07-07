ALTER TABLE patient_caregiver_link
ADD COLUMN IF NOT EXISTS caregiver_user_id bigint;

ALTER TABLE patient_caregiver_link
ADD COLUMN IF NOT EXISTS medication_history_read_allowed boolean NOT NULL DEFAULT false;

ALTER TABLE patient_caregiver_link
ADD COLUMN IF NOT EXISTS valid_from timestamp;

ALTER TABLE patient_caregiver_link
ADD COLUMN IF NOT EXISTS valid_to timestamp;

ALTER TABLE patient_caregiver_link
ADD COLUMN IF NOT EXISTS revoked_at timestamp;

UPDATE patient_caregiver_link link
SET caregiver_user_id = caregiver.user_id
FROM caregiver
WHERE link.caregiver_id = caregiver.id
  AND link.caregiver_user_id IS NULL;

UPDATE patient_caregiver_link
SET medication_history_read_allowed = true,
    valid_from = COALESCE(valid_from, created_at)
WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_patient_caregiver_link_patient_caregiver_user_active
ON patient_caregiver_link (patient_id, caregiver_user_id, active);

CREATE INDEX IF NOT EXISTS idx_appointment_doctor_datetime
ON appointment (doctor_id, appointment_date_time);

CREATE INDEX IF NOT EXISTS idx_prescription_patient_created_desc
ON prescription (patient_id, created_at DESC);
