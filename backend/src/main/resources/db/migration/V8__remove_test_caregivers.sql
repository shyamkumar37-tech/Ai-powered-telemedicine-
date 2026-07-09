-- Remove test and QA caregivers from the system
DELETE FROM patient_caregiver_link 
WHERE caregiver_id IN (
    SELECT c.id FROM caregiver c
    JOIN users u ON c.user_id = u.id
    WHERE LOWER(u.full_name) LIKE '%test%' OR LOWER(u.full_name) LIKE '%qa %'
);

DELETE FROM caregiver_intervention
WHERE caregiver_id IN (
    SELECT c.id FROM caregiver c
    JOIN users u ON c.user_id = u.id
    WHERE LOWER(u.full_name) LIKE '%test%' OR LOWER(u.full_name) LIKE '%qa %'
);

DELETE FROM caregiver 
WHERE user_id IN (
    SELECT id FROM users 
    WHERE LOWER(full_name) LIKE '%test%' OR LOWER(full_name) LIKE '%qa %'
);

DELETE FROM users 
WHERE role = 'CAREGIVER' AND (LOWER(full_name) LIKE '%test%' OR LOWER(full_name) LIKE '%qa %');
