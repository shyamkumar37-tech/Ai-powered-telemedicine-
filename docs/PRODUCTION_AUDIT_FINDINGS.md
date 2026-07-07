# TeleCare+ Production Audit Findings

## 1. Booking / Race Condition

❌ Problem:  
`AppointmentServiceImpl#createAppointment` originally used `existsByDoctorIdAndAppointmentDateTime(...)` before insert with no transaction boundary, no row locking, and no DB-enforced uniqueness visible in code.

💥 Production Impact:  
Two concurrent requests can book the same doctor and timestamp. One request checks availability, another inserts first, and both can still pass without a hard uniqueness guarantee.

✅ Fix:  
- Added DB-backed uniqueness on `appointment(doctor_id, appointment_date_time)` in the entity mapping.
- Added indexes for appointment lookup and history queries.
- Added `@Transactional` to booking and status updates.
- Added pessimistic doctor-row locking through `DoctorRepository#findByIdForUpdate(...)`.
- Added `409 Conflict` mapping for duplicate slot insert collisions in `GlobalExceptionHandler`.
- SQL runbook is in `ops/sql/appointment-booking-hardening.sql`.

⚠️ Mistake:  
Do not rely on `exists...()` checks as your concurrency control. That is only a pre-check, not protection.

## 2. Load / Performance

❌ Problem:  
Load-readiness for 50–100 concurrent users was not previously verifiable. Default config also had SQL logging enabled in the shared application config.

💥 Production Impact:  
Under load you get noisy logs, harder bottleneck detection, and no proof whether p95/p99 stay within target.

✅ Fix:  
- Added request-duration logging filter: `RequestTimingFilter`.
- Slow requests now log at `WARN` using `app.observability.slow-request-threshold-ms`.
- Default `spring.jpa.show-sql` changed to `false` in shared config.
- Added k6 scripts:
  - `ops/k6/full-user-journey.js`
  - `ops/k6/race-condition-booking.js`

Run:

```bash
k6 run -e BASE_URL=http://localhost:8080/api -e TEST_EMAIL=patient@telecareplus.com -e TEST_PASSWORD=Password123 ops/k6/full-user-journey.js
k6 run -e BASE_URL=http://localhost:8080/api -e TEST_EMAIL=patient@telecareplus.com -e TEST_PASSWORD=Password123 -e FIXED_SLOT=2030-01-01T10:30:00 ops/k6/race-condition-booking.js
```

Thresholds:
- p95 < 800ms
- p99 < 1500ms
- error rate < 1%

⚠️ Mistake:  
Do not claim 100-user readiness until the k6 run passes against the real environment.

## 3. Payment Flow

❌ Problem:  
Cannot verify — code not provided / subsystem absent.

💥 Production Impact:  
No idempotency, webhook, or payment-state review can be trusted because the repo does not currently expose a real payment implementation.

✅ Fix:  
If payments are required, implement:
- `payments` table with `PENDING`, `SUCCESS`, `FAILED`
- unique `idempotency_key`
- webhook controller as source of truth
- payment status polling endpoint
- duplicate webhook guard by current state check

⚠️ Mistake:  
Do not let frontend callback success mark an appointment as paid.

## 4. Input Validation

❌ Problem:  
`AppointmentDtos.AppointmentRequest.concernSummary` had no DTO-level length validation even though the entity caps storage at 1200 characters.

💥 Production Impact:  
Oversized payloads can fail at persistence time instead of validation time and produce inconsistent client behavior.

✅ Fix:  
- Added `@Size(max = 1200)` to `concernSummary`.
- Trim blank values to `null` before persistence in `AppointmentServiceImpl`.

Recommended validation payloads:

```json
{ "patientId": 1, "doctorId": 1, "appointmentDateTime": "2030-01-01T10:30:00", "mode": "TELECONSULTATION", "concernSummary": "" }
```

```json
{ "patientId": 1, "doctorId": 1, "appointmentDateTime": "2030-01-01T10:30:00", "mode": "TELECONSULTATION", "concernSummary": "😀🔥<script>alert(1)</script>" }
```

```json
{ "patientId": 1, "doctorId": 1, "appointmentDateTime": "2030-01-01T10:30:00", "mode": "TELECONSULTATION", "concernSummary": "A very long string repeated until it exceeds 1200 characters..." }
```

⚠️ Mistake:  
Do not assume entity column length is a substitute for request validation.

## 5. API Failure Handling

❌ Problem:  
Frontend Axios handling is only partially hardened. Booking is not in the offline queue allowlist, so it still relies on page-level error handling.

💥 Production Impact:  
Users can hit timeout/offline failures during booking and only recover if the page handles the error clearly and clears loading state.

✅ Fix:  
Verified safe in current frontend:
- Axios timeout is `15000ms`
- `401` clears auth and redirects
- GET requests can fall back to cached data offline
- booking confirm button disables while loading

Still required in route-by-route review:
- confirm every critical page clears loading in `finally`
- confirm every mutation surface renders timeout/offline/server messages
- do not add booking to offline replay unless the backend is idempotent

⚠️ Mistake:  
Do not queue booking or payment writes offline unless the server can safely deduplicate them.

## 6. Database Correctness and Optimization

❌ Problem:  
Schema governance is still weak. The repo uses `spring.jpa.hibernate.ddl-auto=update` in shared config and has no visible Flyway/Liquibase migrations.

💥 Production Impact:  
You cannot audit or reproduce schema guarantees reliably across environments.

✅ Fix:  
- Added explicit SQL hardening runbook in `ops/sql/appointment-booking-hardening.sql`.
- Added entity-level unique constraint and indexes for appointment access paths.
- Production follow-up still required:
  - move schema management to Flyway or Liquibase
  - switch production profile to validated schema only

⚠️ Mistake:  
Do not use `ddl-auto=update` as your production schema contract.

## 7. Frontend Crash / Stale State Review

❌ Problem:  
Not globally broken, but only some paths are verified safe.

💥 Production Impact:  
Unreviewed pages can still crash on undefined arrays or leave stale UI after mutations.

✅ Fix:  
Verified safe in reviewed code:
- `DoctorList` defaults `doctors = []`
- filtering is guarded
- `PatientBookingPage` defaults doctor and triage arrays
- booking flow navigates away after success, so in-place stale state is not a blocker
- `Button` disables when `loading` is true

Still required:
- route-by-route review for remaining list pages
- verify no duplicate fetches caused by effect misuse

⚠️ Mistake:  
Do not assume one safe component means the whole frontend is safe.

## 8. UI / Responsiveness / Lighthouse Readiness

❌ Problem:  
Cannot verify from code alone.

💥 Production Impact:  
Mobile breakage, modal focus bugs, overflow in translated content, and Lighthouse regressions can still ship unnoticed.

✅ Fix:  
Run browser verification for:
- booking flow at 320px, 375px, 768px
- Tamil / Hindi long-label scenarios
- modal keyboard and focus order
- Lighthouse mobile audit

Fail if:
- CTA buttons overflow or disappear
- modal focus trap is broken
- contrast fails
- Lighthouse performance stays below 90 without accepted justification

Runbook:
1. Open Chrome DevTools.
2. Use Device Toolbar for 320 / 375 / 768 widths.
3. Run Lighthouse with Mobile + Performance + Accessibility + Best Practices.
4. Use Network tab to simulate offline / slow 3G during booking flow.

⚠️ Mistake:  
Do not sign off UI readiness from static code review alone.
