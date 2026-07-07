# TeleCare+

TeleCare+ is a continuity-focused telemedicine academic project built with:

- Frontend: React, CSS, Tailwind CSS
- Backend: Java, Spring Boot
- Database: PostgreSQL

## Architecture Overview

TeleCare+ is designed as a layered object-oriented system:

- `controller`: REST API endpoints
- `service`: interfaces for business capabilities
- `service/impl`: rule-based workflow implementations
- `repository`: Spring Data JPA repositories
- `entity`: relational domain model
- `dto`: request and response contracts
- `security`: JWT authentication and Spring Security
- `config`: CORS, JPA auditing, seed data
- `exception`: centralized exception handling
- `util`: DTO mapping helpers

Core innovation flows:

1. Patient completes symptom triage before booking.
2. Triage engine classifies case as routine, priority, in-person, or emergency.
3. Emergency triage is blocked from normal teleconsult booking and creates alerts.
4. Appointment connects patient, doctor, and triage context.
5. Doctor consultation creates care notes and follow-up plan.
6. Prescription creation auto-generates medication reminders.
7. Patient updates adherence and health readings.
8. Caregiver monitors linked patient adherence and alerts.
9. Dashboard summaries expose continuity-of-care analytics.

## Folder Structure

```text
backend/
  pom.xml
  src/main/java/com/telecareplus/
    config/
    controller/
    dto/
    entity/
      enums/
    exception/
    repository/
    security/
    service/
    service/impl/
    util/
  src/main/resources/
    application.properties

frontend/
  package.json
  vite.config.js
  tailwind.config.js
  postcss.config.js
  index.html
  src/
    components/
    context/
    pages/
    services/
    styles/
    utils/
```

## Key Modules Implemented

- JWT authentication with patient, doctor, and caregiver roles
- Role-based dashboard routing and protected pages
- Patient profile and medical history management
- Doctor profile and consultation workflow
- Caregiver linking and monitoring
- Smart symptom triage with red-flag escalation
- Appointment booking and appointment status management
- Prescription creation and medication reminder generation

## Local Development

Copy the example environment file once, then fill in real local secrets:

```bash
cp .env.example .env
```

For local `mvnw spring-boot:run`, Spring Boot loads the repo-root `.env` via `spring.config.import`. Keep `TELECARE_DB_URL` blank unless you need a custom database URL; the backend defaults to `jdbc:postgresql://localhost:5432/telecareplus`.

Run the backend from the `backend/` folder:

```bash
./mvnw spring-boot:run
```

Run the frontend from the `frontend/` folder:

```bash
npm install
npm run dev
```

Notes:
- The frontend dev server runs on `http://127.0.0.1:5173`.
- The backend runs on `http://localhost:8080` (API base `http://localhost:8080/api`).
- Medication adherence tracking
- Health reading monitoring with abnormal-value alerts
- Structured medical records aggregation

## Demo Credentials

Use these accounts for role-based demo access:

- Patient: `anita@patient.com` / `password123`
- Doctor: `doctor@telecareplus.com` / `Password123`
- Caregiver: `caregiver@telecareplus.com` / `Password123`
- Pharmacist: `pharmacist@telecare.com` / `password123`

Notes:
- Invalid credentials now return a proper `401 Unauthorized`.
- These demo accounts are seeded automatically by the backend seeder.

## Demo Seed Data (Safe Rerun)

TeleCare+ ships with demo seeding enabled by default for development/demo use. It is safe to rerun and will only create missing demo data.

How it works:
- Demo data is seeded at backend startup if `app.demo.seedEnabled=true` (default).
- The seed is idempotent: it creates any missing demo users, appointments, messages, and reminders without duplicating existing demo data.

To trigger a manual re-seed without restarting:

```bash
POST http://localhost:8080/api/system/demo/seed
```

To disable demo seeding (recommended for production):

```properties
app.demo.seedEnabled=false
app.demo.seedEndpointEnabled=false
```

## Local Run Guide

### 1. PostgreSQL

Create a database:

```sql
CREATE DATABASE telecareplus;
```

Default backend config expects:

- database: `telecareplus`
- username: `postgres`
- password: value from `TELECARE_DB_PASSWORD` in `.env`

Use `.env.example` as the template for required local values, including `TELECARE_DB_PASSWORD`, `TELECARE_JWT_SECRET`, and the VAPID push key pair.

### 2. Backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Backend runs on:

- `http://localhost:8080`

### 3. Frontend

Install Node.js first if it is not available on your machine, then run:

```powershell
cd frontend
npm install
npm run dev
```

Frontend runs on:

- `http://localhost:5173`

## Demo Flow Verification

1. Login as patient.
2. Open triage page and submit symptoms.
3. Book appointment using triage result.
4. Login as doctor.
5. Review doctor appointments.
6. Create consultation note.
7. Generate prescription.
8. Login as patient and verify reminders were created.
9. Mark reminders as taken or missed.
10. Add health reading and verify alert behavior.
11. Login as caregiver and review linked patient monitoring.

## Current Verification Status

- Backend compile: verified with `mvn -q -DskipTests compile`
- Frontend build: not executed in this environment because `node` and `npm` are not installed
- Full backend runtime: not executed here because PostgreSQL availability was not confirmed in this environment
