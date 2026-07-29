# Changelog

All notable changes to the **TeleCare+** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-07-29

### Added
- **FHIR R4 Interoperability**: Implemented `FhirTransformer` and `FhirController` exposing `/api/fhir/r4/*` resources.
- **Explainable AI (XAI)**: Integrated `FeatureAttribution` score calculations into `MlRiskModelService`.
- **Wearable IoT Telemetry Stream Ingestion**: Real-time vital sign stream processing at `/api/clinical/wearables/ingest`.
- **PACS DICOM Medical Imaging Engine**: Created `DicomStudy` entity and `DicomController` for PACS WADO-RS imaging metadata.
- **Spring GraphQL API Resolvers**: Added `schema.graphqls` and `PatientGraphQLController` supporting `@QueryMapping`.
- **Billing & Insurance Claims Module**: Added `InsuranceClaim`, `Invoice`, and `BillingController`.
- **Lab Diagnostics & Immunization Module**: Added `LabReport`, `VaccinationRecord`, and `LabReportController`.
- **HIPAA Digital Consent & Lifestyle Logging**: Added `ConsentRecord`, `LifestyleRecord`, and `ConsentAndLifestyleController`.
- **Kubernetes Manifests**: Added production deployments for backend, frontend, PostgreSQL, and Redis in `k8s/`.

---

## [1.1.0] - 2026-07-28

### Changed
- **Spring Modulith Decoupling**: Eliminated all cross-domain package cycles (`appointments <-> clinical`, `ai <-> pharmacy`, `ai <-> clinical`, `admin <-> users`).
- **Event-Driven Architecture**: Replaced direct service references with Spring `ApplicationEventPublisher` (`CaregiverInvitedEvent`, `AlertNotificationEvent`).

---

## [1.0.0] - 2026-07-24

### Added
- Initial Release of TeleCare+ Telemedicine Platform.
- Real-time WebRTC audio/video consultations.
- Multi-channel notification engine (Twilio SMS, JavaMail, WebSockets).
