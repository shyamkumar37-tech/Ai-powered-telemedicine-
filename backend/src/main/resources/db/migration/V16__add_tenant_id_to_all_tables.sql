-- Flyway V16 Migration: Production-Safe Add tenant_id columns, backfill existing records, enforce NOT NULL, and create indexes

-- 1. Add tenant_id column with default value
ALTER TABLE access_audit_log ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'default';
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'default';
ALTER TABLE patient ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'default';
ALTER TABLE doctor ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'default';
ALTER TABLE pharmacist ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'default';
ALTER TABLE caregiver ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'default';
ALTER TABLE ai_audit_event ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'default';
ALTER TABLE chat_message ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'default';
ALTER TABLE conversation ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'default';

-- 2. Backfill any existing NULL values for safety
UPDATE access_audit_log SET tenant_id = 'default' WHERE tenant_id IS NULL;
UPDATE users SET tenant_id = 'default' WHERE tenant_id IS NULL;
UPDATE patient SET tenant_id = 'default' WHERE tenant_id IS NULL;
UPDATE doctor SET tenant_id = 'default' WHERE tenant_id IS NULL;
UPDATE pharmacist SET tenant_id = 'default' WHERE tenant_id IS NULL;
UPDATE caregiver SET tenant_id = 'default' WHERE tenant_id IS NULL;
UPDATE ai_audit_event SET tenant_id = 'default' WHERE tenant_id IS NULL;
UPDATE chat_message SET tenant_id = 'default' WHERE tenant_id IS NULL;
UPDATE conversation SET tenant_id = 'default' WHERE tenant_id IS NULL;

-- 3. Enforce NOT NULL constraints
ALTER TABLE access_audit_log ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE patient ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE doctor ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE pharmacist ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE caregiver ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE ai_audit_event ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE chat_message ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE conversation ALTER COLUMN tenant_id SET NOT NULL;

-- 4. Create performance indexes for tenant-scoped querying
CREATE INDEX IF NOT EXISTS idx_access_audit_log_tenant ON access_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_patient_tenant ON patient(tenant_id);
CREATE INDEX IF NOT EXISTS idx_doctor_tenant ON doctor(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pharmacist_tenant ON pharmacist(tenant_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_tenant ON caregiver(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_event_tenant ON ai_audit_event(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_tenant ON chat_message(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversation_tenant ON conversation(tenant_id);
