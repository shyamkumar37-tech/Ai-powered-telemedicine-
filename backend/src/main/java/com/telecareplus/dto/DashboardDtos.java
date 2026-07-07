package com.telecareplus.dto;

import com.telecareplus.entity.enums.RiskLevel;
import java.util.List;

public class DashboardDtos {

    public record DashboardSummaryResponse(
            long totalAppointments,
            long pendingAppointments,
            long prescriptionCount,
            long pendingMedicationReminders,
            double adherencePercentage,
            String recentTriageCategory,
            long followUpDueItems,
            List<String> recentHealthAlerts,
            int riskScore,
            RiskLevel riskLevel,
            long activeCarePlanCount
    ) {}
}
