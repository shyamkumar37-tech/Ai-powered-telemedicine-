package com.telecareplus.ai.ml;

import com.telecareplus.ai.dto.AiDtos;
import com.telecareplus.entity.HealthRecord;
import com.telecareplus.entity.TriageAssessment;
import com.telecareplus.entity.enums.ReminderStatus;
import com.telecareplus.exception.ResourceNotFoundException;
import com.telecareplus.repository.HealthRecordRepository;
import com.telecareplus.repository.MedicationReminderRepository;
import com.telecareplus.repository.PatientRepository;
import com.telecareplus.repository.TriageAssessmentRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MlRiskModelService {

    private final PatientRepository patientRepository;
    private final HealthRecordRepository healthRecordRepository;
    private final TriageAssessmentRepository triageAssessmentRepository;
    private final MedicationReminderRepository medicationReminderRepository;

    @Value("${telecare.ml.risk.enabled:false}")
    private boolean enabled;

    public boolean isEnabled() {
        return enabled;
    }

    public AiDtos.RiskPredictionResponse predict(Long patientId) {
        patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        List<String> drivers = new ArrayList<>();
        List<HealthRecord> records = healthRecordRepository.findByPatientIdOrderByRecordedAtDesc(patientId);
        HealthRecord latest = records.isEmpty() ? null : records.get(0);

        double score = 0.0;
        score += sigmoidFeature(latest != null && latest.getSpo2() != null && latest.getSpo2() < 94, 1.3, drivers, "Low SpO2 in latest vitals.");
        score += sigmoidFeature(latest != null && latest.getSugar() != null && latest.getSugar() > 160, 1.1, drivers, "Elevated sugar readings detected.");
        score += sigmoidFeature(latest != null && isHighBp(latest.getBloodPressure()), 1.0, drivers, "Blood pressure above target range.");
        score += sigmoidFeature(latest != null && latest.getPulse() != null && latest.getPulse() > 110, 0.7, drivers, "Pulse above resting range.");

        long missed = medicationReminderRepository.countByPatientIdAndStatus(patientId, ReminderStatus.MISSED);
        score += sigmoidFeature(missed >= 3, 0.8, drivers, "Missed medication reminders in recent period.");

        List<TriageAssessment> triage = triageAssessmentRepository.findByPatientIdOrderByAssessedAtDesc(patientId);
        if (!triage.isEmpty() && triage.get(0).getLevel() != null) {
            String level = triage.get(0).getLevel().name().toLowerCase(Locale.ROOT);
            if (level.contains("emergency") || level.contains("in_person")) {
                score += 1.6;
                drivers.add("Recent triage suggests high urgency.");
            } else if (level.contains("priority")) {
                score += 0.9;
                drivers.add("Recent triage suggests moderate urgency.");
            }
        }

        double probability = sigmoid(score);
        int normalized = (int) Math.round(probability * 100);
        String category = normalized >= 70 ? "High" : normalized >= 40 ? "Moderate" : "Low";

        if (drivers.isEmpty()) {
            drivers.add("No strong risk signals detected in current data.");
        }

        return new AiDtos.RiskPredictionResponse(
                category,
                normalized,
                drivers,
                "ML risk model (logistic regression) for clinician review only."
        );
    }

    private double sigmoidFeature(boolean condition, double weight, List<String> drivers, String reason) {
        if (!condition) {
            return 0.0;
        }
        drivers.add(reason);
        return weight;
    }

    private double sigmoid(double value) {
        return 1.0 / (1.0 + Math.exp(-value));
    }

    private boolean isHighBp(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }
        String[] parts = value.split("/");
        if (parts.length < 2) {
            return false;
        }
        try {
            int systolic = Integer.parseInt(parts[0].trim());
            int diastolic = Integer.parseInt(parts[1].trim());
            return systolic > 140 || diastolic > 90;
        } catch (NumberFormatException ex) {
            return false;
        }
    }
}
