package com.telecareplus.ai.controller;

import com.telecareplus.ai.dto.AiExtensionDtos;
import com.telecareplus.ai.service.AiAuditService;
import com.telecareplus.ai.service.AiExtensionService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai/extensions")
@RequiredArgsConstructor
public class AiExtensionController {

    private final AiExtensionService aiExtensionService;
    private final AiAuditService aiAuditService;

    @GetMapping("/anomaly/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','CAREGIVER') and @accessScopeAuthorizer.canAccessPatientCare(authentication, #patientId)")
    public AiExtensionDtos.AnomalyReportResponse anomalyReport(@PathVariable Long patientId) {
        var response = aiExtensionService.buildAnomalyReport(patientId);
        aiAuditService.recordEvent("anomaly-detection", patientId, null, response.rationale(), null, String.join(" | ", response.anomalies()), response.severity());
        return response;
    }

    @GetMapping("/recommendations/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','CAREGIVER') and @accessScopeAuthorizer.canAccessPatientCare(authentication, #patientId)")
    public AiExtensionDtos.RecommendationResponse recommendations(@PathVariable Long patientId) {
        var response = aiExtensionService.buildRecommendations(patientId);
        aiAuditService.recordEvent("personal-recommendations", patientId, null, response.rationale(), null, String.join(" | ", response.recommendations()), "LOW");
        return response;
    }

    @PostMapping("/n8n/trigger")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','CAREGIVER') and @accessScopeAuthorizer.canAccessPatientCare(authentication, #request.patientId())")
    public AiExtensionDtos.WorkflowTriggerResponse triggerWorkflow(@RequestBody AiExtensionDtos.WorkflowTriggerRequest request) {
        var response = aiExtensionService.triggerWorkflow(request);
        aiAuditService.recordEvent("n8n-trigger", request.patientId(), null, response.rationale(), request.workflowName(), response.status(), response.status());
        return response;
    }
}
