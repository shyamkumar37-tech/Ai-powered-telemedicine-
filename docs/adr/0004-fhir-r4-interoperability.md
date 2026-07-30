# 4. Standardized HL7 FHIR R4 Interoperability Layer

* **Status**: Accepted
* **Date**: 2026-07-28

## Context

Integrating TeleCare+ with external hospital Electronic Health Record (EHR) systems (such as Epic, Cerner, or AthenaHealth) requires standardized medical data exchange formats.

## Decision

We implemented a dedicated **HL7 FHIR R4 Interoperability API** (`/api/fhir/r4/*`) utilizing `FhirTransformer` to transform internal JPA domain entities into standard `FhirPatientResource`, `FhirObservationResource`, and `FhirEncounterResource` JSON specifications.

## Consequences

* **Positive**: Out-of-the-box compatibility with international healthcare interoperability standards.
* **Positive**: Third-party hospital systems can query patient vitals and clinical encounters using standard FHIR R4 queries.
* **Negative**: Requires maintaining transformer mappers alongside internal REST DTOs.

## Alternatives Considered

* **Proprietary JSON APIs**: Rejected for external EHR integration due to vendor lock-in and integration friction.
