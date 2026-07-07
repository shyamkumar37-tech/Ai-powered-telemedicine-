ALTER TABLE appointment
ADD CONSTRAINT uk_appointment_doctor_datetime
UNIQUE (doctor_id, appointment_date_time);

CREATE INDEX IF NOT EXISTS idx_appointment_doctor_datetime
ON appointment (doctor_id, appointment_date_time);

CREATE INDEX IF NOT EXISTS idx_appointment_patient_datetime
ON appointment (patient_id, appointment_date_time DESC);

CREATE INDEX IF NOT EXISTS idx_appointment_doctor_history
ON appointment (doctor_id, appointment_date_time DESC);

EXPLAIN ANALYZE
SELECT *
FROM appointment
WHERE doctor_id = 1
  AND appointment_date_time = TIMESTAMP '2030-01-01 10:30:00';

EXPLAIN ANALYZE
SELECT *
FROM appointment
WHERE patient_id = 1
ORDER BY appointment_date_time DESC;
