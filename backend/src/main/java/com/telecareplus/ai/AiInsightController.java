package com.telecareplus.ai;

import com.telecareplus.ai.AiInsightDtos;
import com.telecareplus.ai.AiAuditService;
import com.telecareplus.ai.AiInsightService;
import com.telecareplus.ai.AiRiskService;
import com.telecareplus.ai.MoodJournalService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai/insights")
@RequiredArgsConstructor
public class AiInsightController {

    private final AiInsightService aiInsightService;
    private final AiRiskService aiRiskService;
    private final MoodJournalService moodJournalService;
    private final AiAuditService aiAuditService;

    @GetMapping("/adherence/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','CAREGIVER') and @accessScopeAuthorizer.canAccessPatientCare(authentication, #patientId)")
    public AiInsightDtos.AdherenceCoachResponse adherence(@PathVariable Long patientId) {
        var response = aiInsightService.buildAdherenceCoach(patientId);
        aiAuditService.recordEvent("adherence-coach", patientId, null, response.rationale(), null, "rate=" + response.adherenceRate(), "LOW");
        return response;
    }

    @GetMapping("/health-trends/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','CAREGIVER') and @accessScopeAuthorizer.canAccessPatientCare(authentication, #patientId)")
    public AiInsightDtos.HealthTrendResponse healthTrends(@PathVariable Long patientId) {
        var response = aiInsightService.buildHealthTrends(patientId);
        aiAuditService.recordEvent("health-trends", patientId, null, response.rationale(), null, response.summary(), "LOW");
        return response;
    }

    @GetMapping("/symptom-trends/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','CAREGIVER') and @accessScopeAuthorizer.canAccessPatientCare(authentication, #patientId)")
    public AiInsightDtos.SymptomTrendResponse symptomTrends(@PathVariable Long patientId) {
        var response = aiInsightService.buildSymptomTrends(patientId);
        aiAuditService.recordEvent("symptom-trends", patientId, null, response.rationale(), null, response.summary(), "LOW");
        return response;
    }

    @GetMapping("/consultation-prep/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','CAREGIVER') and @accessScopeAuthorizer.canAccessPatientCare(authentication, #patientId)")
    public AiInsightDtos.ConsultationPrepResponse consultationPrep(@PathVariable Long patientId) {
        var response = aiInsightService.buildConsultationPrep(patientId);
        aiAuditService.recordEvent("consultation-prep", patientId, null, response.rationale(), null, response.summary(), "LOW");
        return response;
    }

    @GetMapping("/follow-up/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','CAREGIVER') and @accessScopeAuthorizer.canAccessPatientCare(authentication, #patientId)")
    public AiInsightDtos.FollowUpRecommendationResponse followUp(@PathVariable Long patientId) {
        var response = aiInsightService.buildFollowUp(patientId);
        aiAuditService.recordEvent("follow-up", patientId, null, response.rationale(), null, response.urgency(), response.urgency());
        return response;
    }

    @GetMapping("/journey/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','CAREGIVER') and @accessScopeAuthorizer.canAccessPatientCare(authentication, #patientId)")
    public AiInsightDtos.JourneyPlanResponse journey(@PathVariable Long patientId) {
        var response = aiInsightService.buildJourneyPlan(patientId);
        aiAuditService.recordEvent("journey-plan", patientId, null, List.of("Derived from triage, appointments, and reminders."), null, response.summary(), "LOW");
        return response;
    }

    @GetMapping("/risk-queue/doctor/{doctorId}")
    @PreAuthorize("hasRole('DOCTOR') and @accessScopeAuthorizer.canAccessDoctor(authentication, #doctorId)")
    public AiInsightDtos.RiskQueueResponse doctorQueue(@PathVariable Long doctorId) {
        var response = aiInsightService.buildDoctorRiskQueue(doctorId, aiRiskService);
        aiAuditService.recordEvent("doctor-risk-queue", null, null, List.of("Aggregated risk from assigned patients."), null, "items=" + response.patients().size(), "MEDIUM");
        return response;
    }

    @GetMapping("/caregiver/priority-queue/{caregiverId}")
    @PreAuthorize("hasRole('CAREGIVER') and @accessScopeAuthorizer.canAccessCaregiver(authentication, #caregiverId)")
    public AiInsightDtos.PriorityQueueResponse caregiverQueue(@PathVariable Long caregiverId) {
        var response = aiInsightService.buildCaregiverPriorityQueue(caregiverId);
        aiAuditService.recordEvent("caregiver-priority-queue", null, null, List.of("Prioritized by alerts and missed reminders."), null, "items=" + response.patients().size(), "MEDIUM");
        return response;
    }

    @GetMapping("/caregiver/deviations/{patientId}")
    @PreAuthorize("hasAnyRole('CAREGIVER','PATIENT','DOCTOR') and @accessScopeAuthorizer.canAccessPatientCare(authentication, #patientId)")
    public AiInsightDtos.BehavioralDeviationResponse deviations(@PathVariable Long patientId) {
        var response = aiInsightService.buildBehavioralDeviation(patientId);
        aiAuditService.recordEvent("behavior-deviation", patientId, null, response.rationale(), null, String.join(" | ", response.alerts()), "MEDIUM");
        return response;
    }

    @GetMapping("/caregiver/checkin-script/{patientId}")
    @PreAuthorize("hasAnyRole('CAREGIVER','DOCTOR') and @accessScopeAuthorizer.canAccessPatientCare(authentication, #patientId)")
    public AiInsightDtos.CheckInScriptResponse checkInScript(@PathVariable Long patientId) {
        var response = aiInsightService.buildCheckInScript(patientId);
        aiAuditService.recordEvent("checkin-script", patientId, null, response.rationale(), null, response.script(), "LOW");
        return response;
    }

    @GetMapping("/consultation-summary/{consultationId}")
    @PreAuthorize("hasRole('DOCTOR') and @accessScopeAuthorizer.canAccessConsultation(authentication, #consultationId)")
    public AiInsightDtos.ConsultationSummaryResponse consultationSummary(@PathVariable Long consultationId) {
        var response = aiInsightService.buildConsultationSummary(consultationId);
        aiAuditService.recordEvent("consultation-summary", null, null, response.rationale(), null, response.assessment(), "LOW");
        return response;
    }

    @PostMapping("/differential-suggestions")
    @PreAuthorize("hasRole('DOCTOR')")
    public AiInsightDtos.DifferentialSuggestionResponse differential(@RequestBody AiInsightDtos.DifferentialSuggestionRequest request) {
        var response = aiInsightService.buildDifferentialSuggestions(request);
        aiAuditService.recordEvent("differential", null, null, response.rationale(), request.symptoms(), String.join(" | ", response.suggestions()), "LOW");
        return response;
    }

    @PostMapping("/drug-interactions")
    @PreAuthorize("hasRole('DOCTOR')")
    public AiInsightDtos.DrugInteractionResponse drugInteractions(@RequestBody AiInsightDtos.DrugInteractionRequest request) {
        var response = aiInsightService.buildDrugInteractions(request);
        aiAuditService.recordEvent("drug-interactions", null, null, response.rationale(), String.join(",", request.medicines()), String.join(" | ", response.warnings()), "MEDIUM");
        return response;
    }

    @GetMapping("/pharmacy/refill-prediction/{pharmacistId}")
    @PreAuthorize("hasRole('PHARMACIST') and @accessScopeAuthorizer.canAccessPharmacist(authentication, #pharmacistId)")
    public AiInsightDtos.RefillPredictionResponse refillPrediction(@PathVariable Long pharmacistId) {
        var response = aiInsightService.buildRefillPrediction(pharmacistId);
        aiAuditService.recordEvent("refill-prediction", null, null, List.of("Based on recent dispense records."), null, "items=" + response.items().size(), "LOW");
        return response;
    }

    @GetMapping("/pharmacy/inventory-risk/{pharmacistId}")
    @PreAuthorize("hasRole('PHARMACIST') and @accessScopeAuthorizer.canAccessPharmacist(authentication, #pharmacistId)")
    public AiInsightDtos.InventoryRiskResponse inventoryRisk(@PathVariable Long pharmacistId) {
        var response = aiInsightService.buildInventoryRisk(pharmacistId);
        aiAuditService.recordEvent("inventory-risk", null, null, List.of("Based on reorder levels."), null, String.join(" | ", response.alerts()), "LOW");
        return response;
    }

    @PostMapping("/pharmacy/substitutions")
    @PreAuthorize("hasRole('PHARMACIST')")
    public AiInsightDtos.SubstitutionSuggestionResponse substitutions(@RequestBody AiInsightDtos.SubstitutionSuggestionRequest request) {
        var response = aiInsightService.buildSubstitutions(request);
        aiAuditService.recordEvent("substitutions", null, null, List.of("Rule-based suggestion."), request.medicineName(), String.join(" | ", response.suggestions()), "LOW");
        return response;
    }

    @PostMapping("/mood/{patientId}")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public AiInsightDtos.MoodEntryResponse logMood(@PathVariable Long patientId, @RequestBody AiInsightDtos.MoodEntryRequest request) {
        return moodJournalService.logEntry(patientId, request);
    }

    @GetMapping("/mood/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','CAREGIVER') and @accessScopeAuthorizer.canAccessPatientCare(authentication, #patientId)")
    public List<AiInsightDtos.MoodEntryResponse> moodEntries(@PathVariable Long patientId) {
        return moodJournalService.getEntries(patientId);
    }

    @GetMapping("/mood/{patientId}/trends")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','CAREGIVER') and @accessScopeAuthorizer.canAccessPatientCare(authentication, #patientId)")
    public AiInsightDtos.MoodTrendResponse moodTrend(@PathVariable Long patientId) {
        return moodJournalService.buildTrend(patientId);
    }

    @GetMapping("/stress-recommendations/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','CAREGIVER') and @accessScopeAuthorizer.canAccessPatientCare(authentication, #patientId)")
    public AiInsightDtos.StressCopingResponse stressRecommendations(@PathVariable Long patientId) {
        var entries = moodJournalService.getEntries(patientId);
        return aiInsightService.buildStressRecommendations(patientId, entries);
    }
}
