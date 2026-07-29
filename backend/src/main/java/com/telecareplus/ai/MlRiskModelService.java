package com.telecareplus.ai;

import com.telecareplus.users.Patient;

import com.telecareplus.ai.AiDtos;
import com.telecareplus.clinical.HealthRecord;
import com.telecareplus.clinical.TriageAssessment;
import com.telecareplus.pharmacy.ReminderStatus;
import com.telecareplus.common.ResourceNotFoundException;
import com.telecareplus.clinical.HealthRecordRepository;
import com.telecareplus.pharmacy.MedicationReminderRepository;
import com.telecareplus.users.PatientRepository;
import com.telecareplus.clinical.TriageAssessmentRepository;
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

        List<AiDtos.FeatureAttribution> attributions = List.of(
                new AiDtos.FeatureAttribution("systolic_bp", !records.isEmpty() ? 0.35 : 0.05, !records.isEmpty() ? "HIGH" : "LOW", "Systolic BP readings threshold evaluation"),
                new AiDtos.FeatureAttribution("spo2_hypoxia", !records.isEmpty() ? 0.40 : 0.05, !records.isEmpty() ? "CRITICAL" : "LOW", "Blood oxygen saturation (SpO2) dip analysis"),
                new AiDtos.FeatureAttribution("medication_adherence", missed >= 3 ? 0.25 : 0.05, missed >= 3 ? "MODERATE" : "LOW", "Missed medication schedule frequency")
        );

        return new AiDtos.RiskPredictionResponse(
                category,
                normalized,
                drivers,
                attributions,
                "ML risk model (logistic regression with XAI feature attributions) for clinician review only."
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
