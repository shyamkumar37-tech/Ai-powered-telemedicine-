package com.telecareplus.clinical;

import com.telecareplus.users.Patient;

import com.telecareplus.clinical.TriageDtos;
import com.telecareplus.clinical.TriageAssessment;
import com.telecareplus.common.AlertSeverity;
import com.telecareplus.clinical.TriageLevel;
import com.telecareplus.common.ResourceNotFoundException;
import com.telecareplus.users.PatientRepository;
import com.telecareplus.clinical.TriageAssessmentRepository;
import com.telecareplus.notification.AlertService;
import com.telecareplus.clinical.TriageService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TriageServiceImpl implements TriageService {

    private final PatientRepository patientRepository;
    private final TriageAssessmentRepository triageAssessmentRepository;
    private final AlertService alertService;

    @Override
    public TriageDtos.TriageResponse createAssessment(TriageDtos.TriageRequest request) {
        var patient = patientRepository.findById(request.patientId()).orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        TriageAssessment triage = new TriageAssessment();
        triage.setPatient(patient);
        triage.setSymptoms(request.symptoms());
        triage.setSymptomDurationDays(request.symptomDurationDays());
        triage.setChestPain(Boolean.TRUE.equals(request.chestPain()));
        triage.setSevereBreathlessness(Boolean.TRUE.equals(request.severeBreathlessness()));
        triage.setFainting(Boolean.TRUE.equals(request.fainting()));
        triage.setOxygenLevel(request.oxygenLevel());
        triage.setTemperature(request.temperature());
        triage.setPersistentHighFever(Boolean.TRUE.equals(request.persistentHighFever()));
        triage.setAssessedAt(LocalDateTime.now());
        TriageLevel level = evaluateLevel(request);
        triage.setLevel(level);
        triage.setRecommendation(buildRecommendation(level));
        triage = triageAssessmentRepository.save(triage);

        if (level == TriageLevel.EMERGENCY_GO_TO_HOSPITAL || level == TriageLevel.IN_PERSON_VISIT_RECOMMENDED) {
            alertService.createAlert(
                    patient.getId(),
                    level == TriageLevel.EMERGENCY_GO_TO_HOSPITAL ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
                    level == TriageLevel.EMERGENCY_GO_TO_HOSPITAL
                            ? "Immediate in-person medical attention recommended. Do not continue routine teleconsult flow."
                            : "In-person visit recommended based on current symptom red flags."
            );
        }
        return toTriageResponse(triage);
    }

    @Override
    public List<TriageDtos.TriageResponse> getPatientHistory(Long patientId) {
        return triageAssessmentRepository.findByPatientIdOrderByAssessedAtDesc(patientId)
                .stream()
                .map(this::toTriageResponse)
                .collect(Collectors.toList());
    }

    private TriageDtos.TriageResponse toTriageResponse(TriageAssessment triage) {
        return new TriageDtos.TriageResponse(triage.getId(), triage.getLevel(), triage.getRecommendation(), triage.getSymptoms(), triage.getAssessedAt());
    }

    private TriageLevel evaluateLevel(TriageDtos.TriageRequest request) {
        if (Boolean.TRUE.equals(request.chestPain()) || Boolean.TRUE.equals(request.severeBreathlessness())
                || Boolean.TRUE.equals(request.fainting()) || (request.oxygenLevel() != null && request.oxygenLevel() < 90)) {
            return TriageLevel.EMERGENCY_GO_TO_HOSPITAL;
        }
        if ((request.temperature() != null && request.temperature() >= 102 && Boolean.TRUE.equals(request.persistentHighFever()))
                || (request.oxygenLevel() != null && request.oxygenLevel() < 94)) {
            return TriageLevel.IN_PERSON_VISIT_RECOMMENDED;
        }
        if ((request.symptomDurationDays() != null && request.symptomDurationDays() > 5) || Boolean.TRUE.equals(request.persistentHighFever())) {
            return TriageLevel.PRIORITY_CONSULTATION;
        }
        return TriageLevel.ROUTINE_CONSULTATION;
    }

    private String buildRecommendation(TriageLevel level) {
        if (level == TriageLevel.EMERGENCY_GO_TO_HOSPITAL) {
            return "Emergency signs detected. Seek immediate hospital care and notify caregiver.";
        }
        if (level == TriageLevel.IN_PERSON_VISIT_RECOMMENDED) {
            return "A physical examination is recommended before teleconsult continuation.";
        }
        if (level == TriageLevel.PRIORITY_CONSULTATION) {
            return "Priority consultation advised within 24 hours with continuity review.";
        }
        return "Routine teleconsultation can be booked with symptom and history review.";
    }
}
