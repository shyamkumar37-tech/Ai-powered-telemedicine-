package com.telecareplus.ai.service;

import com.telecareplus.ai.dto.AiDtos;
import com.telecareplus.entity.Patient;
import com.telecareplus.exception.ResourceNotFoundException;
import com.telecareplus.repository.PatientRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AiTreatmentService {

    private final PatientRepository patientRepository;

    public AiDtos.TreatmentRecommendationResponse recommend(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        List<String> suggestions = new ArrayList<>();
        String diseases = patient.getDiseases() == null ? "" : patient.getDiseases().toLowerCase(Locale.ENGLISH);

        if (diseases.contains("diabetes")) {
            suggestions.add("Emphasize low-glycemic meals and consistent medication timing.");
            suggestions.add("Encourage daily glucose tracking and hydration reminders.");
        }
        if (diseases.contains("hypertension") || diseases.contains("blood pressure")) {
            suggestions.add("Recommend reduced sodium intake and moderate daily activity.");
            suggestions.add("Track blood pressure at least 3 times per week.");
        }
        if (diseases.contains("asthma") || diseases.contains("copd")) {
            suggestions.add("Review inhaler adherence and avoid known triggers.");
        }

        if (suggestions.isEmpty()) {
            suggestions.add("Encourage balanced diet, hydration, and regular movement.");
            suggestions.add("Reinforce medication adherence and follow-up scheduling.");
        }

        return new AiDtos.TreatmentRecommendationResponse(
                suggestions,
                "AI suggestions are supportive only. Doctor review required before use."
        );
    }
}
