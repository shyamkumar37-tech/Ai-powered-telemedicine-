package com.telecareplus.clinical;

import com.telecareplus.users.Patient;

import com.telecareplus.users.PatientRepository;
import com.telecareplus.common.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "FHIR R4 Interoperability", description = "Standardized FHIR R4 Healthcare Data Exchange Endpoints")
@RestController
@RequestMapping("/api/fhir/r4")
@RequiredArgsConstructor
public class FhirController {

    private final PatientRepository patientRepository;
    private final HealthRecordRepository healthRecordRepository;
    private final ConsultationNoteRepository consultationNoteRepository;

    @Operation(summary = "Get FHIR R4 Patient Resource")
    @GetMapping("/Patient/{id}")
    public ResponseEntity<FhirDtos.FhirPatientResource> getFhirPatient(@PathVariable Long id) {
        var patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        return ResponseEntity.ok(FhirTransformer.toFhirPatient(patient));
    }

    @Operation(summary = "Get FHIR R4 Observations for Patient")
    @GetMapping("/Observation")
    public ResponseEntity<FhirDtos.FhirBundle> getFhirObservations(@RequestParam Long patient) {
        var records = healthRecordRepository.findByPatientIdOrderByRecordedAtDesc(patient);
        List<Object> entries = records.stream()
                .map(FhirTransformer::toFhirObservation)
                .map(res -> (Object) res)
                .toList();

        return ResponseEntity.ok(new FhirDtos.FhirBundle(
                "Bundle",
                "searchset",
                entries.size(),
                entries
        ));
    }

    @Operation(summary = "Get FHIR R4 Encounters for Patient")
    @GetMapping("/Encounter")
    public ResponseEntity<FhirDtos.FhirBundle> getFhirEncounters(@RequestParam Long patient) {
        var notes = consultationNoteRepository.findByPatientIdOrderByCreatedAtDesc(patient);
        List<Object> entries = notes.stream()
                .map(FhirTransformer::toFhirEncounter)
                .map(res -> (Object) res)
                .toList();

        return ResponseEntity.ok(new FhirDtos.FhirBundle(
                "Bundle",
                "searchset",
                entries.size(),
                entries
        ));
    }
}
