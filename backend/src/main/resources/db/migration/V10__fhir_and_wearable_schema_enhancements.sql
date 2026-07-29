-- Flyway V10 Migration: FHIR R4 Interoperability & Wearable IoT Telemetry Schema Enhancements

-- Index for fast FHIR Observation lookup by patient and date
CREATE INDEX IF NOT EXISTS idx_health_record_fhir_patient_date 
ON health_record (patient_id, recorded_at DESC);

-- Index for fast FHIR Encounter lookup by patient
CREATE INDEX IF NOT EXISTS idx_consultation_note_fhir_patient 
ON consultation_note (patient_id, created_at DESC);
