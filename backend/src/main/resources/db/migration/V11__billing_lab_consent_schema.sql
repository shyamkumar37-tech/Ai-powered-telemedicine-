-- Flyway V11 Migration: Billing, Insurance, Lab Results, Vaccination, Consent & Lifestyle Schema

CREATE TABLE IF NOT EXISTS insurance_claim (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient(id),
    policy_number VARCHAR(100) NOT NULL,
    provider_name VARCHAR(150) NOT NULL,
    claim_amount NUMERIC(10, 2) NOT NULL,
    approved_amount NUMERIC(10, 2),
    status VARCHAR(50) NOT NULL,
    diagnosis_code VARCHAR(50),
    submitted_at TIMESTAMP NOT NULL,
    tenant_id VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient(id),
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    total_amount NUMERIC(10, 2) NOT NULL,
    copay_amount NUMERIC(10, 2) NOT NULL,
    payment_status VARCHAR(50) NOT NULL,
    payment_transaction_id VARCHAR(150),
    issued_at TIMESTAMP NOT NULL,
    paid_at TIMESTAMP,
    tenant_id VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lab_report (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient(id),
    test_name VARCHAR(200) NOT NULL,
    loinc_code VARCHAR(50),
    result_value VARCHAR(255),
    reference_range VARCHAR(100),
    status VARCHAR(50),
    attachment_url VARCHAR(500),
    ordered_at TIMESTAMP NOT NULL,
    reported_at TIMESTAMP NOT NULL,
    tenant_id VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vaccination_record (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient(id),
    vaccine_name VARCHAR(200) NOT NULL,
    batch_number VARCHAR(100),
    cvx_code VARCHAR(50),
    administered_date DATE NOT NULL,
    booster_due_date DATE,
    administrator_name VARCHAR(150),
    tenant_id VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consent_record (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient(id),
    consent_type VARCHAR(100) NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT TRUE,
    digital_signature VARCHAR(255),
    granted_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    tenant_id VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lifestyle_record (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient(id),
    log_date DATE NOT NULL,
    calories_consumed INT,
    sleep_hours NUMERIC(4, 2),
    exercise_minutes INT,
    steps_count INT,
    nutrition_summary VARCHAR(1000),
    tenant_id VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_insurance_claim_patient ON insurance_claim(patient_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_patient ON invoice(patient_id, issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_lab_report_patient ON lab_report(patient_id, reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_vaccination_patient ON vaccination_record(patient_id, administered_date DESC);
CREATE INDEX IF NOT EXISTS idx_lifestyle_patient ON lifestyle_record(patient_id, log_date DESC);
