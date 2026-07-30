# 💼 TeleCare+ Portfolio & Resume Technical Highlights

This document provides FAANG-ready resume bullet points, engineering achievements, and technical design trade-offs for candidates showcasing **TeleCare+**.

---

## 🚀 Resume-Ready Bullet Points

- **Architected & Engineered Enterprise AI Telemedicine Platform**: Built a modular monolith using **Spring Boot 3.3**, **Java 21 Virtual Threads (`Loom`)**, and **React 18 TypeScript**, serving 5 roles (Patient, Doctor, Caregiver, Pharmacist, Admin) across 10 domain slices.
- **Enforced Spring Modulith Architectural Isolation**: Eliminating 100% of cyclic package dependencies across 330 Java source files, verified via automated CI test governance (`TelecareApplicationModulesTest`).
- **Standardized Healthcare Interoperability Layer**: Integrated **HL7 FHIR R4** (`/api/fhir/r4/*`) patient and observation resources alongside **PACS DICOM** medical imaging metadata services.
- **Implemented Real-Time Telehealth & Analytics**: Built WebRTC audio/video signaling queues, Server-Sent Events (SSE) AI consultation scribing, and Explainable AI (XAI) clinical risk scoring models.
- **Optimized Frontend & Data Performance**: Reduced Vite bundle build time to **1.73s** using custom Rollup vendor chunk splitting (`recharts`, `react-dom`), HikariCP connection pooling, and Flyway SQL migration indexes.

---

## 🏛️ Engineering Trade-Offs & Key Decisions

1. **Modular Monolith vs. Microservices**:
   - *Decision*: Adopted Spring Modulith to maintain zero network latency and deployment simplicity while enforcing strict package boundary rules that allow future microservice extraction without code rewrites.

2. **Server-Sent Events (SSE) vs. WebSockets for AI Scribing**:
   - *Decision*: Used SSE for token-by-token LLM summaries (unidirectional client streaming) and WebSockets strictly for WebRTC peer signaling and multi-party chat.

3. **Flyway Migrations vs. JPA Auto-DDL**:
   - *Decision*: Utilized Flyway as the sole source of database truth in production (`spring.jpa.hibernate.ddl-auto=validate`) to eliminate schema drift and unexpected DDL table locks.
