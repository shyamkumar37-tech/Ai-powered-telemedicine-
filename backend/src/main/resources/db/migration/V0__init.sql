CREATE TABLE IF NOT EXISTS doctor (
    id BIGSERIAL PRIMARY KEY,
    experience_years integer,
    consultation_fee numeric(10,2)
);

CREATE TABLE IF NOT EXISTS caregiver (
    id BIGSERIAL PRIMARY KEY,
    user_id bigint
);

CREATE TABLE IF NOT EXISTS patient_caregiver_link (
    id BIGSERIAL PRIMARY KEY,
    patient_id bigint,
    caregiver_id bigint,
    caregiver_user_id bigint,
    active boolean,
    created_at timestamp
);

CREATE TABLE IF NOT EXISTS appointment (
    id BIGSERIAL PRIMARY KEY,
    doctor_id bigint,
    appointment_date_time timestamp,
    status varchar(50)
);

CREATE TABLE IF NOT EXISTS prescription (
    id BIGSERIAL PRIMARY KEY,
    patient_id bigint,
    created_at timestamp
);

CREATE TABLE IF NOT EXISTS medication_reminder (
    id BIGSERIAL PRIMARY KEY,
    patient_id bigint,
    scheduled_date timestamp,
    status varchar(50)
);

CREATE TABLE IF NOT EXISTS health_record (
    id BIGSERIAL PRIMARY KEY,
    patient_id bigint,
    recorded_at timestamp
);

CREATE TABLE IF NOT EXISTS triage_assessment (
    id BIGSERIAL PRIMARY KEY,
    patient_id bigint,
    assessed_at timestamp
);

CREATE TABLE IF NOT EXISTS consultation_note (
    id BIGSERIAL PRIMARY KEY,
    patient_id bigint,
    created_at timestamp
);

CREATE TABLE IF NOT EXISTS alert_notification (
    id BIGSERIAL PRIMARY KEY,
    patient_id bigint,
    active boolean,
    created_at timestamp
);

CREATE TABLE IF NOT EXISTS care_plan (
    id BIGSERIAL PRIMARY KEY,
    patient_id bigint,
    active boolean
);

CREATE TABLE IF NOT EXISTS pharmacy_inventory_item (
    id BIGSERIAL PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    active boolean DEFAULT true,
    email_notifications_enabled boolean,
    sms_notifications_enabled boolean,
    push_notifications_enabled boolean,
    full_name varchar(255),
    role varchar(50)
);

CREATE TABLE IF NOT EXISTS caregiver_intervention (
    id BIGSERIAL PRIMARY KEY,
    caregiver_id bigint
);
