-- TeleCare+ HIPAA Immutable Audit Log Database Triggers
-- Conforms to HIPAA Security Rule §164.312(b) Audit Controls

CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'HIPAA Compliance Violation: Access Audit Log entries are immutable and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

-- Apply Immutable Trigger to access_audit_log Table
DROP TRIGGER IF EXISTS trg_prevent_audit_log_update ON access_audit_log;
CREATE TRIGGER trg_prevent_audit_log_update
BEFORE UPDATE OR DELETE ON access_audit_log
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_modification();
