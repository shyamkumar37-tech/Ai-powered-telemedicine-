package com.telecareplus.ai;

import com.telecareplus.ai.AiDtos;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class AiMentalHealthService {

    public AiDtos.MentalHealthChatResponse chat(AiDtos.MentalHealthChatRequest request) {
        String message = request.message() == null ? "" : request.message().trim();
        String sessionId = request.sessionId() == null || request.sessionId().isBlank()
                ? UUID.randomUUID().toString()
                : request.sessionId();

        var assessment = assessText(message);
        List<String> suggestions = new ArrayList<>();
        String response;

        if ("High".equals(assessment.riskLevel())) {
            response = "It sounds like you are going through something very intense. You deserve immediate support.";
            suggestions.add("Reach out to a trusted person or caregiver now.");
            suggestions.add("If you feel unsafe, seek emergency or crisis help in your area.");
        } else if ("Moderate".equals(assessment.riskLevel())) {
            response = "Thanks for sharing. Let us take this step by step and focus on what you are feeling today.";
            suggestions.add("Try a short breathing exercise and a 10-minute walk if possible.");
            suggestions.add("Consider booking a follow-up with your care team for additional support.");
        } else {
            response = "I am here to listen. Tell me more about what has been on your mind recently.";
            suggestions.add("Maintain sleep and hydration routines.");
            suggestions.add("Keep a small journal of mood changes for your care team.");
        }

        return new AiDtos.MentalHealthChatResponse(
                sessionId,
                response,
                assessment.riskLevel(),
                suggestions,
                "High".equals(assessment.riskLevel())
        );
    }

    public AiDtos.MentalHealthAssessmentResponse assess(AiDtos.MentalHealthAssessmentRequest request) {
        String text = request.text() == null ? "" : request.text().trim();
        return assessText(text);
    }

    private AiDtos.MentalHealthAssessmentResponse assessText(String text) {
        String lower = text.toLowerCase(Locale.ENGLISH);
        List<String> indicators = new ArrayList<>();
        String risk = "Low";

        if (containsAny(lower, "suicide", "kill myself", "end it", "self-harm")) {
            indicators.add("Self-harm language detected.");
            risk = "High";
        }
        if (containsAny(lower, "hopeless", "worthless", "panic", "anxious", "anxiety")) {
            indicators.add("Anxiety or hopelessness markers detected.");
            risk = "Moderate";
        }
        if (containsAny(lower, "sad", "depressed", "tired", "exhausted")) {
            indicators.add("Low mood markers detected.");
        }

        if (indicators.isEmpty()) {
            indicators.add("No high-risk phrases detected.");
        }

        String guidance = "This check-in is supportive only and not a diagnosis.";
        return new AiDtos.MentalHealthAssessmentResponse(risk, indicators, guidance);
    }

    private boolean containsAny(String text, String... tokens) {
        for (String token : tokens) {
            if (text.contains(token)) {
                return true;
            }
        }
        return false;
    }
}
