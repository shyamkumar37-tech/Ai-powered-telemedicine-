# 🏥 TeleCare+ AI Telemedicine & Care Continuity Platform

A modular monolith telemedicine and remote patient monitoring platform built with **Spring Boot 3.3**, **Java 21 Virtual Threads**, **Spring Modulith**, and **React 18 TypeScript**.

---

## 1. Project Overview

**TeleCare+** is an open-source telemedicine platform designed for continuous care management, video consultations, clinical AI scribing, and remote patient monitoring. The backend is structured into zero-cycle domain packages governed by **Spring Modulith**, while the frontend is a single-page application (SPA) built with React 18 and Tailwind CSS.

---

## 2. Key Features

- 👨‍⚕️ **Multi-Role Portal**: Dedicated workflows for Patients, Doctors, Caregivers, Pharmacists, and Administrators.
- 📹 **WebRTC Teleconsultations**: Real-time peer-to-peer audio/video calling with WebSockets signaling.
- 🤖 **Generative AI Clinical Scribe**: Real-time Server-Sent Events (SSE) streaming for LLM consultation summaries.
- 📊 **Explainable AI (XAI) Risk Scoring**: Logistic deterioration model augmented with feature attribution impact scores.
- 🏥 **Healthcare Interoperability**: HL7 FHIR R4 resources (`Patient`, `Observation`, `Encounter`) and PACS DICOM imaging metadata.
- 💊 **Pharmacy & e-Prescriptions**: Prescription lifecycle, inventory tracking, and medication reminders.
- 💳 **Billing & Claims**: Patient copay invoicing and insurance claim processing.

---

## 3. Architecture

TeleCare+ follows a **Spring Modulith Modular Monolith** pattern. Package dependencies flow downward from domain slices into shared infrastructure, and cross-domain events communicate asynchronously via Spring `ApplicationEventPublisher`.

```mermaid
graph TD
    A[common] --> B[users]
    A --> C[clinical]
    A --> D[pharmacy]
    A --> E[communication]
    A --> F[notification]
    A --> G[ai]
    A --> H[appointments]
    A --> I[billing]
    A --> J[admin]

    users --> clinical
    users --> pharmacy
    appointments --> users
    clinical --> appointments
    ai --> clinical
    ai --> pharmacy
    billing --> users
    admin --> users
```

---

## 4. Technology Stack

- **Backend Framework**: Spring Boot 3.3.5, Java 21 (Virtual Threads)
- **Architecture Governance**: Spring Modulith 1.2.0
- **Frontend Framework**: React 18, TypeScript 5, Vite, Tailwind CSS
- **Database**: PostgreSQL 16, Flyway Migrations (`V1__` through `V13__`)
- **Caching & Messaging**: Redis 7, WebSockets (STOMP)
- **API Standards**: REST, GraphQL (Spring GraphQL), HL7 FHIR R4

---

## 5. Architecture Diagrams

### System Component Map
![TeleCare+ Architecture](assets/telecare_architecture.svg)

### Entity Relationship Diagram (ERD)
![TeleCare+ ERD](assets/telecare_erd.svg)

---

## 6. Live Demo

- **Frontend Application**: `https://telecareplus.vercel.app`
- **Backend API**: `https://telecareplus-api.onrender.com`

---

## 7. API Documentation

- **Swagger UI**: `https://telecareplus-api.onrender.com/swagger-ui.html`
- **OpenAPI 3.0 Specification**: [`docs/openapi.json`](docs/openapi.json)
- **Postman Collection**: [`docs/telecareplus.postman_collection.json`](docs/telecareplus.postman_collection.json)

---

## 8. Quick Start

### Prerequisites
- JDK 21
- Node.js 20+
- PostgreSQL 16 & Redis 7

### Backend Setup
```bash
cd backend
chmod +x ./mvnw
./mvnw clean compile -DskipTests
./mvnw spring-boot:run
```

### Frontend Setup
```bash
cd frontend
npm ci --legacy-peer-deps
npm run dev
```

---

## 9. Docker Deployment

```bash
docker compose up -d
```

---

## 10. Kubernetes Deployment

```bash
kubectl apply -f k8s/postgres-redis-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
```

---

## 11. Testing

```bash
# Run Spring Modulith boundary tests
cd backend
./mvnw test -Dtest=TelecareApplicationModulesTest

# Run full backend test suite
./mvnw test

# Run frontend build verification
cd ../frontend
npm run build
```

---

## 12. Security

- **Authentication**: Stateless JWT Bearer tokens paired with OAuth2 Resource Server.
- **HIPAA Audit Logging**: `@AuditLog` annotation logging PHI data access to `access_audit_log`.
- **Security Headers**: Content Security Policy (`CSP`), HSTS, and XSS protection configured in Spring Security.
- **Data Protection**: See [`SECURITY.md`](SECURITY.md) for vulnerability disclosure guidelines.

---

## 13. Project Structure

```text
├── backend/                  # Spring Boot 3 Java 21 Application
│   ├── src/main/java/com/telecareplus/
│   │   ├── admin/            # System & User Administration
│   │   ├── ai/               # LLM Scribe, RAG, XAI Risk Scoring
│   │   ├── appointments/     # Appointment Booking & Schedule Management
│   │   ├── billing/          # Invoices & Insurance Claims
│   │   ├── clinical/         # Vitals, FHIR R4, IoT Stream Ingestion, DICOM
│   │   ├── common/           # Shared Base Entities & Events
│   │   ├── communication/    # WebRTC Signaling & WebSocket Chat
│   │   ├── notification/     # SMS, Email & Push Alert Dispatchers
│   │   ├── pharmacy/         # e-Prescriptions & Inventory
│   │   └── users/            # Patient, Doctor, Caregiver Profiles & Consent
│   └── src/main/resources/db/migration/ # Flyway SQL Migration Scripts
├── frontend/                 # React 18 TypeScript SPA
│   ├── src/components/       # Reusable UI Components & Layouts
│   ├── src/context/          # Auth & Language Context Providers
│   ├── src/pages/            # Role Dashboards & Clinical Views
│   └── src/services/         # Axios API Services
├── docs/                     # Documentation Hierarchy
│   ├── audits/               # Engineering & Risk Audits
│   └── portfolio/            # Resume Highlights & Engineering Trade-offs
├── k8s/                      # Kubernetes Deployment Manifests
└── assets/                   # SVG Architecture & System Diagrams
```

---

## 14. Roadmap

See [`ROADMAP.md`](ROADMAP.md) for release milestones.

---

## 15. Contributing

Please review [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

---

## 16. License

Released under the [MIT License](LICENSE).
