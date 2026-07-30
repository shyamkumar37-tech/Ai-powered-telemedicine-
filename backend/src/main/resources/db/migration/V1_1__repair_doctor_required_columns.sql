ALTER TABLE doctor
ADD COLUMN IF NOT EXISTS experience_years integer;

ALTER TABLE doctor
ADD COLUMN IF NOT EXISTS consultation_fee numeric(10,2);

UPDATE doctor
SET experience_years = 0
WHERE experience_years IS NULL;

UPDATE doctor
SET consultation_fee = 0.00
WHERE consultation_fee IS NULL;

ALTER TABLE doctor
ALTER COLUMN experience_years SET NOT NULL;

ALTER TABLE doctor
ALTER COLUMN consultation_fee SET NOT NULL;
