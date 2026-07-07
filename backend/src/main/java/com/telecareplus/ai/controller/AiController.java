package com.telecareplus.ai.controller;

import com.telecareplus.ai.dto.AiDtos;
import com.telecareplus.ai.service.AiMentalHealthService;
import com.telecareplus.ai.service.AiReportService;
import com.telecareplus.ai.service.AiRiskService;
import com.telecareplus.ai.service.AiTreatmentService;
import com.telecareplus.ai.service.AiVoiceIntakeService;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiReportService aiReportService;
    private final AiRiskService aiRiskService;
    private final AiTreatmentService aiTreatmentService;
    private final AiMentalHealthService aiMentalHealthService;
    private final AiVoiceIntakeService aiVoiceIntakeService;

    @GetMapping("/report-summary/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','CAREGIVER') and @accessScopeAuthorizer.canAccessPatientCare(authentication, #patientId)")
    public AiDtos.ReportSummaryResponse reportSummary(@PathVariable Long patientId) {
        return aiReportService.generateSummary(patientId);
    }

    @PostMapping("/report-summary/export/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','CAREGIVER') and @accessScopeAuthorizer.canAccessPatientCare(authentication, #patientId)")
    public AiDtos.ReportExportResponse exportReport(@PathVariable Long patientId) {
        AiDtos.ReportSummaryResponse summary = aiReportService.generateSummary(patientId);
        String content = buildExportText(summary);
        String encoded = Base64.getEncoder().encodeToString(content.getBytes(StandardCharsets.UTF_8));
        return new AiDtos.ReportExportResponse(
                "telecare-ai-summary.txt",
                "text/plain",
                encoded
        );
    }

    @GetMapping("/risk-prediction/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','CAREGIVER') and @accessScopeAuthorizer.canAccessPatientCare(authentication, #patientId)")
    public AiDtos.RiskPredictionResponse riskPrediction(@PathVariable Long patientId) {
        return aiRiskService.predictRisk(patientId);
    }

    @GetMapping("/treatment-recommendations/{patientId}")
    @PreAuthorize("hasRole('DOCTOR') and @accessScopeAuthorizer.canAccessPatientCare(authentication, #patientId)")
    public AiDtos.TreatmentRecommendationResponse treatmentRecommendations(@PathVariable Long patientId) {
        return aiTreatmentService.recommend(patientId);
    }

    @PostMapping("/mental-health/chat")
    @PreAuthorize("hasRole('PATIENT')")
    public AiDtos.MentalHealthChatResponse mentalHealthChat(@RequestBody AiDtos.MentalHealthChatRequest request) {
        return aiMentalHealthService.chat(request);
    }

    @PostMapping("/mental-health/assessment")
    @PreAuthorize("hasRole('PATIENT')")
    public AiDtos.MentalHealthAssessmentResponse mentalHealthAssessment(@RequestBody AiDtos.MentalHealthAssessmentRequest request) {
        return aiMentalHealthService.assess(request);
    }

    @PostMapping("/voice-intake/start")
    @PreAuthorize("hasRole('DOCTOR') and (#request == null or #request.patientId() == null or @accessScopeAuthorizer.canAccessPatientCare(authentication, #request.patientId()))")
    public AiDtos.VoiceIntakeStartResponse voiceIntakeStart(@RequestBody(required = false) AiDtos.VoiceIntakeStartRequest request) {
        return aiVoiceIntakeService.start(request == null ? new AiDtos.VoiceIntakeStartRequest(null, null) : request);
    }

    @PostMapping("/voice-intake/process")
    @PreAuthorize("hasRole('DOCTOR')")
    public AiDtos.VoiceIntakeProcessResponse voiceIntakeProcess(@RequestBody AiDtos.VoiceIntakeProcessRequest request) {
        return aiVoiceIntakeService.process(request);
    }

    @PostMapping("/voice-intake/finalize")
    @PreAuthorize("hasRole('DOCTOR')")
    public AiDtos.VoiceIntakeSummaryResponse voiceIntakeFinalize(@RequestBody AiDtos.VoiceIntakeFinalizeRequest request) {
        return aiVoiceIntakeService.finalizeSession(request);
    }

    private String buildExportText(AiDtos.ReportSummaryResponse summary) {
        StringBuilder builder = new StringBuilder();
        builder.append("TeleCare+ AI Summary").append("\n");
        builder.append("Patient: ").append(summary.patientName()).append("\n\n");
        builder.append("Overview: ").append(summary.overview()).append("\n\n");
        builder.append("Recent complaints:\n");
        for (String item : summary.recentComplaints()) {
            builder.append("- ").append(item).append("\n");
        }
        builder.append("\nDiagnosis summary: ").append(summary.diagnosisSummary()).append("\n\n");
        builder.append("Prescribed medicines:\n");
        for (String item : summary.prescribedMedicines()) {
            builder.append("- ").append(item).append("\n");
        }
        builder.append("\nFollow-up advice:\n");
        for (String item : summary.followUpAdvice()) {
            builder.append("- ").append(item).append("\n");
        }
        builder.append("\n").append(summary.disclaimer()).append("\n");
        return builder.toString();
    }
}
