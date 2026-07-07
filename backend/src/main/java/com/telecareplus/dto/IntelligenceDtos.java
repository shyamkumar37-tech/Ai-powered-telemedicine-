package com.telecareplus.dto;

import com.telecareplus.entity.enums.AlertSeverity;
import com.telecareplus.entity.enums.RiskLevel;
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
}
