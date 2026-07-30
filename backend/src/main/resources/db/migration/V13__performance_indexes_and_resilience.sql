-- Flyway V13 Migration: Performance Compound Indexing for Audit Trail and Vitals Querying

CREATE INDEX IF NOT EXISTS idx_access_audit_timestamp_patient ON access_audit_log(created_at DESC, patient_id);
CREATE INDEX IF NOT EXISTS idx_health_record_recorded_patient ON health_record(recorded_at DESC, patient_id);
