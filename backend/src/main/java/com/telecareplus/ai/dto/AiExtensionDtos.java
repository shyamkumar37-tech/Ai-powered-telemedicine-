package com.telecareplus.ai.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class AiExtensionDtos {

    public record AnomalyReportResponse(
            String severity,
            List<String> anomalies,
            List<String> rationale,
            String disclaimer
    ) {}

    public record RecommendationResponse(
            List<String> recommendations,
            List<String> rationale,
            String disclaimer
    ) {}

    public record WorkflowTriggerRequest(
            String workflowName,
            Long patientId,
            Map<String, Object> payload
    ) {}

    public record WorkflowTriggerResponse(
            String status,
            String message,
            LocalDateTime timestamp,
            List<String> rationale
    ) {}
}
