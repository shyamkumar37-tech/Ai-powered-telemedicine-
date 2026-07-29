package com.telecareplus.ai;

import com.telecareplus.ai.AiPremiumDtos;
import com.telecareplus.ai.AiAuditService;
import com.telecareplus.ai.AiPremiumService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai/premium")
@RequiredArgsConstructor
public class AiPremiumController {

    private final AiPremiumService aiPremiumService;
    private final AiAuditService aiAuditService;

    @PostMapping("/symptom-chat")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','CAREGIVER') and @accessScopeAuthorizer.canAccessPatientCare(authentication, #request.patientId())")
    public AiPremiumDtos.SymptomChatResponse symptomChat(@RequestBody AiPremiumDtos.SymptomChatRequest request) {
        var response = aiPremiumService.buildSymptomChat(request);
        aiAuditService.recordEvent("symptom-chat", request.patientId(), null, response.rationale(), request.message(), response.reply(), response.triageLevel());
        return response;
    }

    @GetMapping("/risk-snapshot/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','CAREGIVER') and @accessScopeAuthorizer.canAccessPatientCare(authentication, #patientId)")
    public AiPremiumDtos.RiskSnapshotResponse riskSnapshot(@PathVariable Long patientId) {
        var response = aiPremiumService.buildRiskSnapshot(patientId);
        aiAuditService.recordEvent("risk-snapshot", patientId, null, response.drivers(), "risk snapshot", response.category(), response.confidence());
        return response;
    }

    @GetMapping("/appointment-prep/{patientId}")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public AiPremiumDtos.AppointmentPrepResponse appointmentPrep(@PathVariable Long patientId) {
        var response = aiPremiumService.buildAppointmentPrep(patientId);
        aiAuditService.recordEvent("appointment-prep", patientId, null, response.rationale(), "appointment prep", String.join(" | ", response.checklist()), "Low");
        return response;
    }

    @GetMapping("/follow-up-plan/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR') and @accessScopeAuthorizer.canAccessPatientCare(authentication, #patientId)")
    public AiPremiumDtos.FollowUpPlanResponse followUpPlan(@PathVariable Long patientId) {
        var response = aiPremiumService.buildFollowUpPlan(patientId);
        aiAuditService.recordEvent("follow-up-plan", patientId, null, response.rationale(), "follow-up plan", String.join(" | ", response.planItems()), "Low");
        return response;
    }

    @PostMapping("/icd-suggestions")
    @PreAuthorize("hasRole('DOCTOR')")
    public AiPremiumDtos.IcdSuggestionResponse icdSuggestions(@RequestBody AiPremiumDtos.IcdSuggestionRequest request) {
        var response = aiPremiumService.buildIcdSuggestions(request);
        aiAuditService.recordEvent("icd-suggestions", null, null, response.rationale(), request.notes(), String.join(" | ", response.codes()), "Low");
        return response;
    }

    @GetMapping("/careplan-adherence/{patientId}")
    @PreAuthorize("hasAnyRole('CAREGIVER','DOCTOR') and @accessScopeAuthorizer.canAccessPatientCare(authentication, #patientId)")
    public AiPremiumDtos.CarePlanAdherenceResponse carePlanAdherence(@PathVariable Long patientId) {
        var response = aiPremiumService.buildCarePlanAdherence(patientId);
        aiAuditService.recordEvent("careplan-adherence", patientId, null, response.rationale(), "care plan adherence", String.join(" | ", response.gaps()), "Low");
        return response;
    }

    @GetMapping("/dispense-anomaly/{pharmacistId}")
    @PreAuthorize("hasRole('PHARMACIST') and @accessScopeAuthorizer.canAccessPharmacist(authentication, #pharmacistId)")
    public AiPremiumDtos.DispenseAnomalyResponse dispenseAnomaly(@PathVariable Long pharmacistId) {
        var response = aiPremiumService.buildDispenseAnomaly(pharmacistId);
        aiAuditService.recordEvent("dispense-anomaly", null, pharmacistId, response.rationale(), "dispense anomaly", String.join(" | ", response.alerts()), "Low");
        return response;
    }

    @GetMapping("/automation-plans")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR','CAREGIVER')")
    public AiPremiumDtos.AutomationPlanResponse automationPlans() {
        var response = aiPremiumService.buildAutomationPlans();
        aiAuditService.recordEvent("automation-plans", null, null, List.of("Automation flows generated"), "automation plans", "generated", "Low");
        return response;
    }

    @GetMapping("/escalation-rules/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR','CAREGIVER') and @accessScopeAuthorizer.canAccessPatientCare(authentication, #patientId)")
    public AiPremiumDtos.EscalationRulesResponse escalationRules(@PathVariable Long patientId) {
        var response = aiPremiumService.buildEscalationRules(patientId);
        aiAuditService.recordEvent("escalation-rules", patientId, null, List.of("Escalation rules generated"), "escalation rules", "generated", "Medium");
        return response;
    }

    @GetMapping("/compliance-dashboard")
    @PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
    public AiPremiumDtos.ComplianceDashboardResponse complianceDashboard() {
        var response = aiPremiumService.buildComplianceDashboard();
        aiAuditService.recordEvent("compliance-dashboard", null, null, response.highlights(), "compliance dashboard", "generated", "Low");
        return response;
    }

    @GetMapping("/predictive-risk/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR') and @accessScopeAuthorizer.canAccessPatientCare(authentication, #patientId)")
    public AiPremiumDtos.PredictiveRiskResponse predictiveRisk(@PathVariable Long patientId) {
        var response = aiPremiumService.buildPredictiveRisk(patientId);
        aiAuditService.recordEvent("predictive-risk", patientId, null, List.of("Predictive risk forecast generated"), "predictive risk", "generated", "Low");
        return response;
    }

    @PostMapping("/video-analysis")
    @PreAuthorize("hasRole('DOCTOR')")
    public AiPremiumDtos.VideoAnalysisResponse videoAnalysis(@RequestBody AiPremiumDtos.VideoAnalysisRequest request) {
        var response = aiPremiumService.buildVideoAnalysis(request);
        aiAuditService.recordEvent("video-analysis", null, null, response.rationale(), request.observations(), response.summary(), response.riskLevel());
        return response;
    }

    @GetMapping("/report-generator/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','CAREGIVER') and @accessScopeAuthorizer.canAccessPatientCare(authentication, #patientId)")
    public AiPremiumDtos.ReportGeneratorResponse reportGenerator(@PathVariable Long patientId) {
        var response = aiPremiumService.buildReportGenerator(patientId);
        aiAuditService.recordEvent("report-generator", patientId, null, List.of("Report outline generated"), "report generator", response.title(), "Low");
        return response;
    }
}
