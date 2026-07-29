package com.telecareplus.ai;

import java.util.List;

public class AiDtos {

    public record ReportSummaryResponse(
            String patientName,
            String overview,
            List<String> recentComplaints,
            String diagnosisSummary,
            List<String> prescribedMedicines,
            List<String> followUpAdvice,
            String disclaimer,
            String generatedAt
    ) {}

    public record ReportExportResponse(
            String fileName,
            String contentType,
            String base64Content
    ) {}

    public record FeatureAttribution(
            String featureName,
            double weight,
            String impactLevel,
            String clinicalRationale
    ) {}

    public record RiskPredictionResponse(
            String category,
            int score,
            List<String> insights,
            List<FeatureAttribution> attributions,
            String disclaimer
    ) {}

    public record TreatmentRecommendationResponse(
            List<String> suggestions,
            String disclaimer
    ) {}

    public record MentalHealthChatRequest(
            String message,
            String sessionId
    ) {}

    public record MentalHealthChatResponse(
            String sessionId,
            String response,
            String riskLevel,
            List<String> suggestions,
            boolean recommendHumanSupport
    ) {}

    public record MentalHealthAssessmentRequest(
            String text
    ) {}

    public record MentalHealthAssessmentResponse(
            String riskLevel,
            List<String> indicators,
            String guidance
    ) {}

    public record VoiceIntakeStartRequest(
            Long patientId,
            String locale
    ) {}

    public record VoiceIntakeStartResponse(
            String sessionId,
            String nextPrompt
    ) {}

    public record VoiceIntakeProcessRequest(
            String sessionId,
            String stepId,
            String transcript
    ) {}

    public record VoiceIntakeProcessResponse(
            String sessionId,
            String nextPrompt,
            String nextStepId,
            boolean completed
    ) {}

    public record VoiceIntakeFinalizeRequest(
            String sessionId
    ) {}

    public record VoiceIntakeSummaryResponse(
            String sessionId,
            String summary,
            String symptoms,
            String duration,
            String severity,
            String redFlags,
            String disclaimer
    ) {}
}
