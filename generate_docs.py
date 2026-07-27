import os

docs_dir = 'docs'
if not os.path.exists(docs_dir):
    os.makedirs(docs_dir)

def write_doc(filename, content):
    with open(os.path.join(docs_dir, filename), 'w', encoding='utf-8') as f:
        f.write(content)

# 1. Architecture
write_doc('ARCHITECTURE.md', '''# Telecare+ System Architecture

## High-Level System Design
The platform utilizes a modern containerized microservices approach.
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion
- **Backend**: Spring Boot 3, Spring Security, Spring AI, WebSockets (STOMP)
- **Database**: PostgreSQL (Relational Data), Redis (Caching)
- **Search**: Elasticsearch (Audit & Analytics)
- **Identity**: Keycloak (OAuth2 / OIDC)

## Entity Relationship (ER) Diagram
```mermaid
erDiagram
    USERS ||--o{ PATIENTS : "is a"
    USERS ||--o{ DOCTORS : "is a"
    PATIENTS ||--o{ APPOINTMENTS : books
    DOCTORS ||--o{ APPOINTMENTS : conducts
    DOCTORS ||--o{ PRESCRIPTIONS : writes
    PATIENTS ||--o{ PRESCRIPTIONS : receives
```

## Security Flow
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Keycloak
    participant Backend
    User->>Frontend: Login
    Frontend->>Keycloak: Authenticate
    Keycloak-->>Frontend: JWT Access Token
    Frontend->>Backend: Request API (Bearer Token)
    Backend-->>Frontend: Authorized Response
```
''')

# 2. User Manuals
write_doc('USER_MANUALS.md', '''# Telecare+ Comprehensive User Manuals

## Patient Manual
- **Registration**: Navigate to `/register`, select Patient role.
- **Dashboard**: View upcoming appointments, care plans, and recent lab results.
- **Appointments**: Click 'Book Appointment', select a doctor specialty, and pick a time slot.
- **Consultation**: Click 'Join Call' to launch the WebRTC interface.

## Doctor Manual
- **Dashboard**: Track daily queue and patient risk alerts via the AI intelligence hub.
- **Consultations**: Access the split-pane viewer for video calls and live medical record editing.
- **Prescriptions**: Use the digital prescription pad. The CDS (Clinical Decision Support) engine will automatically flag drug interactions.

## Admin Manual
- **User Management**: Approve doctor credentials and manage RBAC (Role-Based Access Control) policies.
- **Audit Logs**: Query Elasticsearch indices via the audit dashboard for compliance tracking.
''')

# 3. Deployment Guide
write_doc('DEPLOYMENT.md', '''# Telecare+ Deployment Guide

## Installation Guide (Local Development)
1. Clone the repository.
2. Run `cp .env.example .env` and populate secrets.
3. Frontend: `cd frontend && npm install && npm run dev`
4. Backend: `cd backend && ./mvnw spring-boot:run`

## Docker Deployment Guide (Production)
1. Ensure Docker Engine and Docker Compose are installed.
2. Run `docker-compose up --build -d`
3. The platform will automatically spin up 6 isolated containers running within the `telecare-net` bridge network.
4. Services map to: Frontend (:5173), Backend API (:8080).
5. All data is persisted via Docker Volumes (`telecareplus-postgres-data`).

## CI/CD Pipeline
- Handled automatically via `.github/workflows/playwright.yml`.
''')

# 4. Operations
write_doc('OPERATIONS.md', '''# Telecare+ Operations Runbook

## Environment Variables
- `TELECARE_DB_PASSWORD`: Core Postgres password.
- `TELECARE_JWT_SECRET`: HS512 secret for token signing.
- `SPRING_DATA_REDIS_HOST`: Redis host URI.

## Performance Optimization Report
- **Frontend**: Implemented React.lazy() and Suspense for route-level code splitting. Vite compresses assets automatically.
- **Backend**: Enabled Resilience4j Rate Limiting, Redis Caching, and strict N+1 query elimination.
- **Security**: Hardened Nginx headers (HSTS, CSP, XSS-Protection).

## Troubleshooting & FAQ
- **Q**: Elasticsearch container exits with code 137 (OOM)?
  **A**: Increase Docker Desktop memory limits to at least 8GB.
- **Q**: Keycloak fails to import realm?
  **A**: Ensure `ops/telecareplus-realm.json` has read permissions.
''')

print("Professional Documentation Generated in docs/ directory.")
