package com.telecareplus.clinical;

import com.telecareplus.clinical.FutureCareDtos;
import java.util.List;

public interface FutureCareService {
    FutureCareDtos.DeteriorationInsightResponse getDeteriorationInsight(Long patientId);
    FutureCareDtos.CopilotRecommendationResponse getCopilotRecommendations(Long patientId);
    FutureCareDtos.AdaptiveTriageResponse getAdaptiveTriage(Long patientId);
    FutureCareDtos.FamilyNetworkResponse getPatientFamilyNetwork(Long patientId);
    FutureCareDtos.CaregiverFamilyNetworkResponse getCaregiverFamilyNetwork(Long caregiverId);
    List<FutureCareDtos.ObservationResponse> getPatientObservations(Long patientId);
    FutureCareDtos.ObservationResponse createObservation(FutureCareDtos.ObservationRequest request);
    FutureCareDtos.FollowUpAutopilotResponse getFollowUpAutopilot(Long patientId);
    List<FutureCareDtos.ReferralSuggestionResponse> getReferralSuggestions(Long doctorId);
    FutureCareDtos.ReferralResponse createReferral(FutureCareDtos.ReferralRequest request);
    List<FutureCareDtos.ReferralResponse> getDoctorReferrals(Long doctorId);
    List<FutureCareDtos.PopulationInsightResponse> getPopulationInsights(Long doctorId);
}
