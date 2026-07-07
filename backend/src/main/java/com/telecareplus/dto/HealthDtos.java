package com.telecareplus.dto;

import com.telecareplus.entity.enums.AlertSeverity;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class HealthDtos {

    public record HealthRecordRequest(
            @NotNull Long patientId,
            String bloodPressure,
            Double sugar,
            Double weight,
            Double spo2,
            Double pulse,
            Double temperature
    ) {}

    public record HealthRecordResponse(
            Long id,
            String bloodPressure,
            Double sugar,
            Double weight,
            Double spo2,
            Double pulse,
            Double temperature,
            AlertSeverity alertSeverity,
            String alertMessage,
            LocalDateTime recordedAt
    ) {}

    public record HealthTrendSummaryResponse(
            int totalReadings,
            Double latestSugar,
            Double previousSugar,
            String sugarTrend,
            Double latestSpo2,
            Double averagePulse,
            String latestBloodPressure,
            AlertSeverity latestAlertSeverity,
            String latestAlertMessage
    ) {}
}
