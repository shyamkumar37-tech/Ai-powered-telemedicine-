package com.telecareplus.ai;

import com.telecareplus.common.AlertSeverity;
import com.telecareplus.clinical.RiskLevel;
import java.time.LocalDateTime;
import java.util.List;

public class IntelligenceDtos {

    public record TimelineEventResponse(
            String type,
            String title,
            String details,
            AlertSeverity severity,
            LocalDateTime occurredAt
    ) {}

    public record CareComplianceResponse(
            double adherencePercentage,
            long missedReminderCount,
            long openAlertCount,
            int recentReadingCount,
            long activeCarePlanCount,
            int complianceScore,
            String complianceLabel
    ) {}

    public record DoctorPriorityPatientResponse(
            Long patientId,
            String patientName,
            int riskScore,
            RiskLevel riskLevel,
            double adherencePercentage,
            long pendingReminders,
            String latestAlert,
            String recommendedAction
    ) {}

    public record MissedCareGapResponse(
            Long patientId,
            String patientName,
            String gapType,
            String message,
            AlertSeverity severity,
            String recommendedAction
    ) {}

    public record PatientEducationResponse(
            String headline,
            List<String> tips
    ) {}

    public record AudioScribeRequest(
            String audioText
    ) {}

    public record AudioScribeResponse(
            String subjective,
            String objective,
            String assessment,
            String plan,
            String fullNotes
    ) {}

    public record DrugInteractionRequest(
            List<String> medications
    ) {}

    public record DrugInteractionResponse(
            List<InteractionAlert> alerts
    ) {}

    public record InteractionAlert(
            String severity,
            String description
    ) {}

    public record DosageCalculationRequest(
            Long patientId,
            String medication
    ) {}

    public record DosageCalculationResponse(
            String recommendedDosage,
            String reason
    ) {}

    public record FormularySubstituteRequest(
            String medication
    ) {}

    public record FormularySubstituteResponse(
            List<String> alternatives,
            String reason
    ) {}

    public record CopilotRequest(
            String query,
            Long patientId
    ) {}

    public record CopilotResponse(
            String answer,
            List<String> sources
    ) {}

    public record OcrPrescriptionResponse(
            String rawText,
            List<String> extractedMedications,
            String instructions
    ) {}
}
