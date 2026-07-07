CREATE TABLE IF NOT EXISTS access_audit_log (
    id BIGSERIAL PRIMARY KEY,
    created_at timestamp NOT NULL,
    updated_at timestamp NOT NULL,
    actor_user_id bigint NULL,
    actor_role varchar(40) NULL,
    patient_id bigint NULL,
    action varchar(80) NOT NULL,
    resource_type varchar(80) NOT NULL,
    outcome varchar(20) NOT NULL,
    request_id varchar(120) NULL,
    source_ip varchar(64) NULL,
    user_agent varchar(512) NULL,
    denial_reason varchar(255) NULL
);

CREATE INDEX IF NOT EXISTS idx_access_audit_log_actor_created
ON access_audit_log (actor_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_access_audit_log_patient_created
ON access_audit_log (patient_id, created_at DESC);
