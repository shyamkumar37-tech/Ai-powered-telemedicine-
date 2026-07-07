ALTER TABLE appointment
DROP CONSTRAINT IF EXISTS appointment_status_check;

ALTER TABLE appointment
ADD CONSTRAINT appointment_status_check
CHECK (
    status IN (
        'BOOKED',
        'REQUESTED',
        'CONFIRMED',
        'COMPLETED',
        'CANCELLED',
        'RESCHEDULED'
    )
);
