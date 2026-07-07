package com.telecareplus.ai.dto;

import java.time.LocalDate;
import java.util.List;

public class AiInsightDtos {

    public record RationaleResponse(
            List<String> reasons
    ) {}

    public record AdherenceCoachResponse(
            double adherenceRate,
            long totalReminders,
            long missedCount,
            int missedStreak,
            List<String> nudges,
            List<String> rationale,
            String disclaimer
    ) {}

    public record HealthTrendResponse(
            String summary,
            List<String> keyTrends,
            List<String> guidance,
            List<String> rationale,
            String disclaimer
    ) {}

    public record FollowUpRecommendationResponse(
            LocalDate recommendedDate,
            String urgency,
            List<String> rationale,
            String disclaimer
    ) {}

    public record JourneyStep(
            String title,
            String status,
            String dueDate,
            String detail
    ) {}

    public record JourneyPlanResponse(
            String summary,
            List<JourneyStep> steps,
            String disclaimer
    ) {}

    public record RiskQueueItem(
            Long patientId,
            String patientName,
            String riskCategory,
            int score,
            List<String> reasons
    ) {}

    public record RiskQueueResponse(
            List<RiskQueueItem> patients,
            String disclaimer
    ) {}

    public record ConsultationSummaryResponse(
            String subjective,
            String objective,
            String assessment,
            String plan,
            List<String> suggestedCodes,
            List<String> rationale,
            String disclaimer
    ) {}

    public record DifferentialSuggestionRequest(
            String symptoms,
            String notes
    ) {}

    public record DifferentialSuggestionResponse(
            List<String> suggestions,
            List<String> rationale,
            String disclaimer
    ) {}

    public record DrugInteractionRequest(
            List<String> medicines
    ) {}

    public record DrugInteractionResponse(
            List<String> warnings,
            List<String> rationale,
            String disclaimer
    ) {}

    public record PriorityQueueItem(
            Long patientId,
            String patientName,
            int priorityScore,
            List<String> reasons
    ) {}

    public record PriorityQueueResponse(
            List<PriorityQueueItem> patients,
            String disclaimer
    ) {}

    public record BehavioralDeviationResponse(
            List<String> alerts,
            List<String> rationale,
            String disclaimer
    ) {}

    public record CheckInScriptResponse(
            String script,
            List<String> rationale,
            String disclaimer
    ) {}

    public record RefillPredictionItem(
            String medicineName,
            LocalDate estimatedRefillDate,
            String status
    ) {}

    public record RefillPredictionResponse(
            List<RefillPredictionItem> items,
            String disclaimer
    ) {}

    public record InventoryRiskResponse(
            List<String> alerts,
            String disclaimer
    ) {}

    public record SubstitutionSuggestionRequest(
            String medicineName
    ) {}

    public record SubstitutionSuggestionResponse(
            List<String> suggestions,
            String disclaimer
    ) {}

    public record MoodEntryRequest(
            int moodScore,
            String notes
    ) {}

    public record MoodEntryResponse(
            Long id,
            int moodScore,
            String notes,
            String createdAt
    ) {}

    public record MoodTrendResponse(
            String summary,
            List<String> highlights,
            String disclaimer
    ) {}

    public record StressCopingResponse(
            List<String> recommendations,
            List<String> rationale,
            String disclaimer
    ) {}
}
