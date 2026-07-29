package com.telecareplus.clinical;

import com.telecareplus.users.Doctor;

import com.telecareplus.users.Patient;

import java.time.format.DateTimeFormatter;
import java.util.List;

public class FhirTransformer {

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public static FhirDtos.FhirPatientResource toFhirPatient(Patient patient) {
        if (patient == null) return null;
        return new FhirDtos.FhirPatientResource(
                "Patient",
                String.valueOf(patient.getId()),
                "MRN-" + patient.getId(),
                patient.getUser() != null ? patient.getUser().getFullName() : "Unknown",
                "unknown",
                patient.getCreatedAt() != null ? patient.getCreatedAt().toLocalDate().toString() : null,
                patient.getUser() != null ? patient.getUser().getEmail() : "",
                patient.getUser() != null && patient.getUser().isActive()
        );
    }

    public static FhirDtos.FhirObservationResource toFhirObservation(HealthRecord record) {
        if (record == null) return null;
        
        FhirDtos.FhirCodeableConcept codeConcept = new FhirDtos.FhirCodeableConcept(
                List.of(new FhirDtos.FhirCoding("http://loinc.org", "8867-4", "Vital Signs")),
                "Vital Observation"
        );

        FhirDtos.FhirReference subjectRef = new FhirDtos.FhirReference(
                "Patient/" + record.getPatient().getId(),
                record.getPatient().getUser() != null ? record.getPatient().getUser().getFullName() : "Patient"
        );

        FhirDtos.FhirQuantity quantity = new FhirDtos.FhirQuantity(
                record.getSpo2() != null ? record.getSpo2() : (record.getPulse() != null ? record.getPulse() : 0.0),
                record.getSpo2() != null ? "%" : "bpm",
                "http://unitsofmeasure.org",
                record.getSpo2() != null ? "%" : "/min"
        );

        return new FhirDtos.FhirObservationResource(
                "Observation",
                String.valueOf(record.getId()),
                codeConcept,
                subjectRef,
                record.getRecordedAt() != null ? record.getRecordedAt().format(ISO_FORMATTER) : null,
                quantity,
                record.getAlertSeverity() != null ? record.getAlertSeverity().name() : "NORMAL"
        );
    }

    public static FhirDtos.FhirEncounterResource toFhirEncounter(ConsultationNote note) {
        if (note == null) return null;

        FhirDtos.FhirCodeableConcept classConcept = new FhirDtos.FhirCodeableConcept(
                List.of(new FhirDtos.FhirCoding("http://terminology.hl7.org/CodeSystem/v3-ActCode", "VR", "Virtual Teleconsultation")),
                "Telehealth Consultation"
        );

        FhirDtos.FhirReference subjectRef = new FhirDtos.FhirReference(
                "Patient/" + note.getPatient().getId(),
                note.getPatient().getUser() != null ? note.getPatient().getUser().getFullName() : "Patient"
        );

        FhirDtos.FhirReference doctorRef = new FhirDtos.FhirReference(
                "Practitioner/" + note.getDoctor().getId(),
                note.getDoctor().getUser() != null ? note.getDoctor().getUser().getFullName() : "Doctor"
        );

        return new FhirDtos.FhirEncounterResource(
                "Encounter",
                String.valueOf(note.getId()),
                "finished",
                classConcept,
                subjectRef,
                doctorRef,
                note.getCreatedAt() != null ? note.getCreatedAt().format(ISO_FORMATTER) : null,
                note.getReviewedAt() != null ? note.getReviewedAt().format(ISO_FORMATTER) : null
        );
    }
}
