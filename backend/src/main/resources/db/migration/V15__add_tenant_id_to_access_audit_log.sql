-- Flyway V15 Migration: Add missing tenant_id columns to all core tables

ALTER TABLE access_audit_log ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'default';
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'default';
ALTER TABLE patient ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'default';
ALTER TABLE doctor ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'default';
ALTER TABLE pharmacist ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'default';
ALTER TABLE caregiver ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'default';
ALTER TABLE ai_audit_event ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'default';
ALTER TABLE chat_message ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'default';
ALTER TABLE conversation ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100) DEFAULT 'default';
