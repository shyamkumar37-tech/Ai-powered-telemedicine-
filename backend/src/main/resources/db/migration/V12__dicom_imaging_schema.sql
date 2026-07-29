-- Flyway V12 Migration: PACS DICOM Medical Imaging Studies Schema

CREATE TABLE IF NOT EXISTS dicom_study (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patient(id),
    study_instance_uid VARCHAR(200) NOT NULL UNIQUE,
    series_instance_uid VARCHAR(200),
    modality VARCHAR(50) NOT NULL,
    study_description VARCHAR(500),
    wado_url VARCHAR(500),
    study_date TIMESTAMP NOT NULL,
    tenant_id VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dicom_study_patient ON dicom_study(patient_id, study_date DESC);
CREATE INDEX IF NOT EXISTS idx_dicom_study_modality ON dicom_study(modality);
