package com.telecareplus.controller;

import com.telecareplus.dto.FutureCareDtos;
import com.telecareplus.service.FutureCareService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/future-care")
@RequiredArgsConstructor
public class FutureCareController {

    private final FutureCareService futureCareService;

    @GetMapping("/patient/{patientId}/deterioration")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public FutureCareDtos.DeteriorationInsightResponse patientDeterioration(@PathVariable Long patientId) {
        return futureCareService.getDeteriorationInsight(patientId);
    }

    @GetMapping("/patient/{patientId}/copilot")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public FutureCareDtos.CopilotRecommendationResponse patientCopilot(@PathVariable Long patientId) {
        return futureCareService.getCopilotRecommendations(patientId);
    }

    @GetMapping("/patient/{patientId}/adaptive-triage")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public FutureCareDtos.AdaptiveTriageResponse adaptiveTriage(@PathVariable Long patientId) {
        return futureCareService.getAdaptiveTriage(patientId);
    }

    @GetMapping("/patient/{patientId}/family-network")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public FutureCareDtos.FamilyNetworkResponse patientFamilyNetwork(@PathVariable Long patientId) {
        return futureCareService.getPatientFamilyNetwork(patientId);
    }

    @GetMapping("/patient/{patientId}/observations")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public List<FutureCareDtos.ObservationResponse> patientObservations(@PathVariable Long patientId) {
        return futureCareService.getPatientObservations(patientId);
    }

    @PostMapping("/observations")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR') and @accessScopeAuthorizer.canCreatePatientObservation(authentication, #request.patientId(), #request.doctorId())")
    public FutureCareDtos.ObservationResponse createObservation(@Valid @RequestBody FutureCareDtos.ObservationRequest request) {
        return futureCareService.createObservation(request);
    }

    @GetMapping("/patient/{patientId}/follow-up-autopilot")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public FutureCareDtos.FollowUpAutopilotResponse followUpAutopilot(@PathVariable Long patientId) {
        return futureCareService.getFollowUpAutopilot(patientId);
    }

    @GetMapping("/doctor/{doctorId}/referral-suggestions")
    @PreAuthorize("hasRole('DOCTOR') and @accessScopeAuthorizer.canAccessDoctor(authentication, #doctorId)")
    public List<FutureCareDtos.ReferralSuggestionResponse> referralSuggestions(@PathVariable Long doctorId) {
        return futureCareService.getReferralSuggestions(doctorId);
    }

    @PostMapping("/referrals")
    @PreAuthorize("hasRole('DOCTOR') and @accessScopeAuthorizer.canReferenceDoctorPatientAppointment(authentication, #request.doctorId(), #request.patientId(), #request.appointmentId())")
    public FutureCareDtos.ReferralResponse createReferral(@Valid @RequestBody FutureCareDtos.ReferralRequest request) {
        return futureCareService.createReferral(request);
    }

    @GetMapping("/doctor/{doctorId}/referrals")
    @PreAuthorize("hasRole('DOCTOR') and @accessScopeAuthorizer.canAccessDoctor(authentication, #doctorId)")
    public List<FutureCareDtos.ReferralResponse> doctorReferrals(@PathVariable Long doctorId) {
        return futureCareService.getDoctorReferrals(doctorId);
    }

    @GetMapping("/doctor/{doctorId}/population-insights")
    @PreAuthorize("hasRole('DOCTOR') and @accessScopeAuthorizer.canAccessDoctor(authentication, #doctorId)")
    public List<FutureCareDtos.PopulationInsightResponse> populationInsights(@PathVariable Long doctorId) {
        return futureCareService.getPopulationInsights(doctorId);
    }

    @GetMapping("/caregiver/{caregiverId}/family-network")
    @PreAuthorize("hasRole('CAREGIVER') and @accessScopeAuthorizer.canAccessCaregiver(authentication, #caregiverId)")
    public FutureCareDtos.CaregiverFamilyNetworkResponse caregiverFamilyNetwork(@PathVariable Long caregiverId) {
        return futureCareService.getCaregiverFamilyNetwork(caregiverId);
    }
}
