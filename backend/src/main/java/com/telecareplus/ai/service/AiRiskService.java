package com.telecareplus.ai.service;

import com.telecareplus.ai.dto.AiDtos;
import com.telecareplus.ai.ml.MlRiskModelService;
import com.telecareplus.entity.HealthRecord;
import com.telecareplus.entity.TriageAssessment;
import com.telecareplus.exception.ResourceNotFoundException;
import com.telecareplus.repository.HealthRecordRepository;
import com.telecareplus.repository.PatientRepository;
import com.telecareplus.repository.TriageAssessmentRepository;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AiRiskService {

    private final PatientRepository patientRepository;
    private final HealthRecordRepository healthRecordRepository;
    private final TriageAssessmentRepository triageAssessmentRepository;
    private final MlRiskModelService mlRiskModelService;

    public AiDtos.RiskPredictionResponse predictRisk(long patientId) {
        if (mlRiskModelService.isEnabled()) {
            return mlRiskModelService.predict(patientId);
        }
        patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        List<String> insights = new ArrayList<>();
        int score = 20;

        List<HealthRecord> records = healthRecordRepository.findByPatientIdOrderByRecordedAtDesc(patientId);
        if (!records.isEmpty()) {
            HealthRecord latest = records.get(0);
            score += evaluateVitalInsights(latest, insights);
        } else {
            insights.add("No recent vitals recorded. Encourage daily monitoring.");
        }

        List<TriageAssessment> triageHistory = triageAssessmentRepository.findByPatientIdOrderByAssessedAtDesc(patientId);
        if (!triageHistory.isEmpty()) {
            TriageAssessment triage = triageHistory.get(0);
            switch (triage.getLevel()) {
                case EMERGENCY_GO_TO_HOSPITAL, IN_PERSON_VISIT_RECOMMENDED -> {
                    score += 35;
                    insights.add("Recent triage indicates high risk escalation.");
                }
                case PRIORITY_CONSULTATION -> {
                    score += 20;
                    insights.add("Recent triage indicates moderate concern.");
                }
                default -> score += 5;
            }
        }

        int normalized = Math.min(100, Math.max(0, score));
        String category = normalized >= 70 ? "High" : normalized >= 40 ? "Moderate" : "Low";

        if (insights.isEmpty()) {
            insights.add("No major risk signals detected in the latest readings.");
        }

        return new AiDtos.RiskPredictionResponse(
                category,
                normalized,
                insights,
                "AI-generated risk insight for clinician review only."
        );
    }

    private int evaluateVitalInsights(HealthRecord record, List<String> insights) {
        int score = 0;
        int[] bp = parseBloodPressure(record.getBloodPressure());
        if (bp[0] > 140 || bp[1] > 90) {
            score += 15;
            insights.add("Blood pressure readings are elevated.");
        }
        if (record.getSugar() != null && record.getSugar() > 160) {
            score += 15;
            insights.add("Blood sugar readings are above target.");
        }
        if (record.getSpo2() != null && record.getSpo2() < 94) {
            score += 20;
            insights.add("SpO2 appears low. Monitor breathing closely.");
        }
        if (record.getPulse() != null && record.getPulse() > 110) {
            score += 10;
            insights.add("Pulse is above typical resting range.");
        }
        if (record.getTemperature() != null && record.getTemperature() > 38.5) {
            score += 10;
            insights.add("Temperature indicates possible fever.");
        }
        return score;
    }

    private int[] parseBloodPressure(String value) {
        if (value == null || value.isBlank()) {
            return new int[]{0, 0};
        }
        String[] parts = value.split("/");
        if (parts.length < 2) {
            return new int[]{0, 0};
        }
        try {
            int systolic = Integer.parseInt(parts[0].trim());
            int diastolic = Integer.parseInt(parts[1].trim());
            return new int[]{systolic, diastolic};
        } catch (NumberFormatException ex) {
            return new int[]{0, 0};
        }
    }
}
