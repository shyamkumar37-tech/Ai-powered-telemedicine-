package com.telecareplus.clinical;

import com.telecareplus.clinical.ObservationSource;
import com.telecareplus.clinical.ReferralStatus;
import com.telecareplus.clinical.ReferralUrgency;
import com.telecareplus.clinical.RiskLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class FutureCareDtos {

    public record DeteriorationInsightResponse(
            Long patientId,
            String patientName,
            int predictedScore,
            RiskLevel predictedRiskLevel,
            String summary,
            List<String> contributingFactors,
            List<String> recommendedActions,
            int abnormalObservationCount,
            long activeCaregiverCount
    ) {}

    public record CopilotRecommendationResponse(
            String headline,
            List<String> patientActions,
            List<String> caregiverActions,
            List<String> doctorActions,
            String escalationDecision
    ) {}

    public record AdaptiveTriageResponse(
            String headline,
            String rationale,
            List<String> questions
    ) {}

    public record CaregiverMemberResponse(
            Long caregiverId,
            String caregiverName,
            String relationshipLabel,
            String phone
    ) {}

    public record FamilyNetworkResponse(
            Long patientId,
            String patientName,
            List<CaregiverMemberResponse> caregivers,
            boolean multiCaregiverSupport,
            String coordinationNote,
            String escalationAdvice
    ) {}

    public record CaregiverLinkedFamilyResponse(
            Long patientId,
            String patientName,
            List<CaregiverMemberResponse> caregivers,
            String coordinationNote,
            boolean sharedSupport
    ) {}

    public record CaregiverFamilyNetworkResponse(
            Long caregiverId,
            String caregiverName,
            List<CaregiverLinkedFamilyResponse> linkedPatients
    ) {}

    public record ObservationRequest(
            @NotNull Long patientId,
            Long doctorId,
            @NotNull ObservationSource source,
            @NotBlank String observationType,
            @NotBlank String metricName,
            @NotBlank String metricValue,
            String unit,
            Boolean abnormalFlag,
            String notes,
            LocalDateTime measuredAt
    ) {}

    public record ObservationResponse(
            Long id,
            Long patientId,
            String patientName,
            Long doctorId,
            String doctorName,
            ObservationSource source,
            String observationType,
            String metricName,
            String metricValue,
            String unit,
            boolean abnormalFlag,
            String notes,
            LocalDateTime measuredAt,
            LocalDateTime createdAt
    ) {}

    public record FollowUpAutopilotResponse(
            LocalDate nextFollowUpDate,
            String urgencyLabel,
            List<String> tasks,
            List<String> reasons
    ) {}

    public record ReferralSuggestionResponse(
            Long patientId,
            String patientName,
            String specialty,
            ReferralUrgency urgency,
            String rationale,
            String recommendedFacility
    ) {}

    public record ReferralRequest(
            @NotNull Long doctorId,
            @NotNull Long patientId,
            Long appointmentId,
            @NotBlank String specialty,
            String targetFacility,
            @NotBlank String reason,
            String recommendationNote,
            @NotNull ReferralUrgency urgency,
            LocalDate recommendedDate
    ) {}

    public record ReferralResponse(
            Long id,
            Long doctorId,
            String doctorName,
            Long patientId,
            String patientName,
            Long appointmentId,
            String specialty,
            String targetFacility,
            String reason,
            String recommendationNote,
            ReferralUrgency urgency,
            ReferralStatus status,
            LocalDate recommendedDate,
            LocalDateTime createdAt
    ) {}

    public record PopulationInsightResponse(
            String title,
            String value,
            String detail
    ) {}
}
