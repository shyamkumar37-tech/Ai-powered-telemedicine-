package com.telecareplus.clinical;

import com.telecareplus.users.Patient;

import com.telecareplus.users.ConsentRecord;
import com.telecareplus.users.ConsentRecordRepository;
import com.telecareplus.users.PatientRepository;
import com.telecareplus.common.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Consent & Lifestyle Tracking", description = "HIPAA Consent Management, Nutrition, Exercise, and Sleep Logging")
@RestController
@RequestMapping("/api/clinical/lifestyle")
@RequiredArgsConstructor
public class ConsentAndLifestyleController {

    private final ConsentRecordRepository consentRepository;
    private final LifestyleRecordRepository lifestyleRepository;
    private final PatientRepository patientRepository;

    public record GrantConsentRequest(
            Long patientId,
            String consentType,
            String digitalSignature
    ) {}

    public record LogLifestyleRequest(
            Long patientId,
            Integer caloriesConsumed,
            Double sleepHours,
            Integer exerciseMinutes,
            Integer stepsCount,
            String nutritionSummary
    ) {}

    @Operation(summary = "Grant HIPAA/GDPR Digital Consent")
    @PostMapping("/consent")
    public ResponseEntity<ConsentRecord> grantConsent(@RequestBody GrantConsentRequest request) {
        var patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        ConsentRecord consent = new ConsentRecord();
        consent.setPatient(patient);
        consent.setConsentType(request.consentType());
        consent.setDigitalSignature(request.digitalSignature());
        consent.setGranted(true);

        return ResponseEntity.ok(consentRepository.save(consent));
    }

    @Operation(summary = "Get Patient Consents")
    @GetMapping("/consent")
    public ResponseEntity<List<ConsentRecord>> getConsents(@RequestParam Long patientId) {
        return ResponseEntity.ok(consentRepository.findByPatientIdOrderByGrantedAtDesc(patientId));
    }

    @Operation(summary = "Log Daily Nutrition, Exercise & Sleep")
    @PostMapping("/log")
    public ResponseEntity<LifestyleRecord> logLifestyle(@RequestBody LogLifestyleRequest request) {
        var patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        LifestyleRecord record = new LifestyleRecord();
        record.setPatient(patient);
        record.setCaloriesConsumed(request.caloriesConsumed());
        record.setSleepHours(request.sleepHours());
        record.setExerciseMinutes(request.exerciseMinutes());
        record.setStepsCount(request.stepsCount());
        record.setNutritionSummary(request.nutritionSummary());

        return ResponseEntity.ok(lifestyleRepository.save(record));
    }

    @Operation(summary = "Get Patient Lifestyle Logs")
    @GetMapping("/logs")
    public ResponseEntity<List<LifestyleRecord>> getLifestyleLogs(@RequestParam Long patientId) {
        return ResponseEntity.ok(lifestyleRepository.findByPatientIdOrderByLogDateDesc(patientId));
    }
}
