package com.telecareplus.clinical;

import java.util.List;

/**
 * FHIR R4 Compliant Data Transfer Objects for Interoperability.
 */
public class FhirDtos {

    public record FhirCoding(
            String system,
            String code,
            String display
    ) {}

    public record FhirCodeableConcept(
            List<FhirCoding> coding,
            String text
    ) {}

    public record FhirReference(
            String reference,
            String display
    ) {}

    public record FhirQuantity(
            Double value,
            String unit,
            String system,
            String code
    ) {}

    public record FhirPatientResource(
            String resourceType,
            String id,
            String identifier,
            String name,
            String gender,
            String birthDate,
            String telecom,
            boolean active
    ) {}

    public record FhirObservationResource(
            String resourceType,
            String id,
            FhirCodeableConcept code,
            FhirReference subject,
            String effectiveDateTime,
            FhirQuantity valueQuantity,
            String interpretation
    ) {}

    public record FhirEncounterResource(
            String resourceType,
            String id,
            String status,
            FhirCodeableConcept classType,
            FhirReference subject,
            FhirReference participant,
            String periodStart,
            String periodEnd
    ) {}

    public record FhirBundle(
            String resourceType,
            String type,
            int total,
            List<Object> entry
    ) {}
}
