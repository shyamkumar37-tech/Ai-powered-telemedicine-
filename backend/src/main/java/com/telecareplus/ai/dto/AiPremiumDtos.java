package com.telecareplus.ai.dto;

import java.time.LocalDate;
import java.util.List;

public class AiPremiumDtos {

    public record SymptomChatRequest(
            Long patientId,
            String message,
            List<String> history,
            String locale
    ) {}

    public record SymptomChatResponse(
            String reply,
            String triageLevel,
            String confidence,
            List<String> keyFindings,
            List<String> nextQuestions,
            List<String> safetyChecklist,
            List<String> rationale,
            String disclaimer
    ) {}

    public record RiskSnapshotResponse(
            String category,
            int score,
            String confidence,
            List<String> drivers,
            String disclaimer
    ) {}

    public record AppointmentPrepResponse(
            List<String> checklist,
            List<String> reminders,
            List<String> rationale,
            String disclaimer
    ) {}

    public record FollowUpPlanResponse(
            LocalDate recommendedDate,
            List<String> planItems,
            List<String> rationale,
            String disclaimer
    ) {}

    public record IcdSuggestionRequest(
            String notes
    ) {}

    public record IcdSuggestionResponse(
            List<String> codes,
            List<String> rationale,
            String disclaimer
    ) {}

    public record CarePlanAdherenceResponse(
            double adherenceRate,
            int missedCount,
            List<String> gaps,
            List<String> recommendations,
            List<String> rationale,
            String disclaimer
    ) {}

    public record DispenseAnomalyResponse(
            List<String> alerts,
            List<String> rationale,
            String disclaimer
    ) {}

    public record AutomationFlow(
            String name,
            String ownerRole,
            String trigger,
            List<String> actions
    ) {}

    public record AutomationPlanResponse(
            List<AutomationFlow> flows,
            String disclaimer
    ) {}

    public record EscalationRule(
            String condition,
            String action,
            String severity,
            String rationale
    ) {}

    public record EscalationRulesResponse(
            List<EscalationRule> rules,
            String disclaimer
    ) {}

    public record ComplianceMetric(
            String name,
            String status,
            String detail
    ) {}

    public record ComplianceDashboardResponse(
            List<ComplianceMetric> metrics,
            List<String> highlights,
            String disclaimer
    ) {}

    public record RiskForecast(
            String condition,
            int probability,
            int horizonDays,
            String rationale
    ) {}

    public record PredictiveRiskResponse(
            List<RiskForecast> forecasts,
            String disclaimer
    ) {}

    public record VideoAnalysisRequest(
            String observations
    ) {}

    public record VideoAnalysisResponse(
            String summary,
            String riskLevel,
            List<String> signals,
            List<String> rationale,
            String disclaimer
    ) {}

    public record ReportSection(
            String title,
            List<String> content
    ) {}

    public record ReportGeneratorResponse(
            String title,
            List<ReportSection> sections,
            boolean exportAvailable,
            String exportType,
            String disclaimer
    ) {}
}
