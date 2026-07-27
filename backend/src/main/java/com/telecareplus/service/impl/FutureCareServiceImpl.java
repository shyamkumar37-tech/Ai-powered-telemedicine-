package com.telecareplus.service.impl;

import com.telecareplus.dto.DashboardDtos;
import com.telecareplus.dto.FutureCareDtos;
import com.telecareplus.entity.AlertNotification;
import com.telecareplus.entity.Appointment;
import com.telecareplus.entity.ConsultationNote;
import com.telecareplus.entity.Caregiver;
import com.telecareplus.entity.Doctor;
import com.telecareplus.entity.HealthRecord;
import com.telecareplus.entity.Patient;
import com.telecareplus.entity.PatientObservation;
import com.telecareplus.entity.ReferralRecommendation;
import com.telecareplus.entity.TriageAssessment;
import com.telecareplus.entity.enums.AlertSeverity;
import com.telecareplus.entity.enums.ReferralStatus;
import com.telecareplus.entity.enums.ReferralUrgency;
import com.telecareplus.entity.enums.RiskLevel;
import com.telecareplus.entity.enums.TriageLevel;
import com.telecareplus.exception.ResourceNotFoundException;
import com.telecareplus.repository.AlertNotificationRepository;
import com.telecareplus.repository.AppointmentRepository;
import com.telecareplus.repository.CarePlanRepository;
import com.telecareplus.repository.CaregiverRepository;
import com.telecareplus.repository.ConsultationNoteRepository;
import com.telecareplus.repository.DoctorRepository;
import com.telecareplus.repository.HealthRecordRepository;
import com.telecareplus.repository.PatientCaregiverLinkRepository;
import com.telecareplus.repository.PatientObservationRepository;
import com.telecareplus.repository.PatientRepository;
import com.telecareplus.repository.ReferralRecommendationRepository;
import com.telecareplus.repository.TriageAssessmentRepository;
import com.telecareplus.service.FutureCareService;
import com.telecareplus.service.ReminderService;
import com.telecareplus.service.VitalThresholdService;
import com.telecareplus.event.EventPublisher;
import com.telecareplus.event.VitalLoggedEvent;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FutureCareServiceImpl implements FutureCareService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final CaregiverRepository caregiverRepository;
    private final PatientCaregiverLinkRepository linkRepository;
    private final AppointmentRepository appointmentRepository;
    private final TriageAssessmentRepository triageAssessmentRepository;
    private final ConsultationNoteRepository consultationNoteRepository;
    private final HealthRecordRepository healthRecordRepository;
    private final AlertNotificationRepository alertNotificationRepository;
    private final CarePlanRepository carePlanRepository;
    private final PatientObservationRepository patientObservationRepository;
    private final ReferralRecommendationRepository referralRecommendationRepository;
    private final VitalThresholdService vitalThresholdService;
    private final EventPublisher eventPublisher;
    private final DashboardServiceImpl dashboardService;
    private final ReminderService reminderService;

    @Override
    public FutureCareDtos.DeteriorationInsightResponse getDeteriorationInsight(Long patientId) {
        Patient patient = findPatient(patientId);
        DashboardDtos.DashboardSummaryResponse dashboard = dashboardService.getPatientDashboard(patientId);
        List<AlertNotification> activeAlerts = alertNotificationRepository.findByPatientIdAndActiveTrueOrderByCreatedAtDesc(patientId);
        int abnormalObservationCount = (int) patientObservationRepository.countByPatientIdAndAbnormalFlagTrue(patientId);
        long activeCaregiverCount = linkRepository.findByPatientIdAndActiveTrue(patientId).size();
        HealthRecord latestHealth = latestHealth(patientId);
        TriageAssessment latestTriage = triageAssessmentRepository.findByPatientIdOrderByAssessedAtDesc(patientId).stream().findFirst().orElse(null);
        String continuityConditions = summarizeConditions(patient);

        int predictedScore = Math.min(
                100,
                dashboard.riskScore()
                        + (abnormalObservationCount * 6)
                        + (activeAlerts.stream().anyMatch(alert -> alert.getSeverity() == AlertSeverity.CRITICAL) ? 12 : 0)
                        + (dashboard.pendingMedicationReminders() >= 3 ? 8 : 0)
                        + (activeCaregiverCount > 1 ? -5 : 0)
        );
        RiskLevel predictedRiskLevel = toRiskLevel(predictedScore);

        List<String> factors = new ArrayList<>();
        if (dashboard.adherencePercentage() < 70) {
            factors.add("Medication adherence is " + dashboard.adherencePercentage() + "%, which is below the safe continuity threshold.");
        }
        if (dashboard.pendingMedicationReminders() > 0) {
            factors.add(dashboard.pendingMedicationReminders() + " medication reminders are still pending and increasing continuity risk.");
        }
        if (!activeAlerts.isEmpty()) {
            factors.add(activeAlerts.size() + " active alert(s) remain open. Latest alert: " + activeAlerts.get(0).getMessage());
        }
        if (abnormalObservationCount > 0) {
            factors.add(abnormalObservationCount + " recent lab or wearable observation(s) contain abnormal values.");
        }
        if (latestHealth != null && latestHealth.getAlertSeverity() == AlertSeverity.CRITICAL) {
            factors.add("Latest health monitoring already reached critical escalation with " + compactVitalSummary(latestHealth) + ".");
        } else if (latestHealth != null && latestHealth.getAlertSeverity() == AlertSeverity.WARNING) {
            factors.add("Latest health monitoring is showing warning-level deterioration with " + compactVitalSummary(latestHealth) + ".");
        }
        if (latestTriage != null && latestTriage.getLevel() != TriageLevel.ROUTINE_CONSULTATION) {
            factors.add("Latest triage is " + latestTriage.getLevel().name().replace('_', ' ').toLowerCase() + " with advice: " + latestTriage.getRecommendation());
        }
        if (factors.isEmpty()) {
            factors.add("Current continuity pattern looks stable for " + continuityConditions + " without major deterioration triggers.");
        }

        List<String> recommendedActions = new ArrayList<>();
        recommendedActions.add("Continue daily medication and health logging for " + continuityConditions + ".");
        if (predictedRiskLevel == RiskLevel.HIGH || predictedRiskLevel == RiskLevel.CRITICAL) {
            recommendedActions.add("Arrange doctor review within 24 to 72 hours because the continuity score is " + predictedScore + "/100.");
        }
        if (activeAlerts.stream().anyMatch(alert -> alert.getSeverity() == AlertSeverity.CRITICAL)) {
            recommendedActions.add("Escalate to in-person review if symptoms worsen or the latest alert stays unresolved.");
        }
        if (activeCaregiverCount > 0) {
            recommendedActions.add("Use the caregiver network (" + activeCaregiverCount + " linked caregiver(s)) to verify today's continuity tasks.");
        }
        if (recommendedActions.size() == 1) {
            recommendedActions.add("Maintain the current continuity plan and follow-up routine because the current signals are relatively stable.");
        }

        String summary = switch (predictedRiskLevel) {
            case CRITICAL -> "The continuity engine predicts a high chance of deterioration for " + continuityConditions + " because multiple risk signals are active.";
            case HIGH -> "Risk signals are rising for " + continuityConditions + " and need priority follow-up.";
            case MODERATE -> "The patient is stable overall but needs tighter continuity supervision for " + continuityConditions + ".";
            case LOW -> "Current continuity signals remain stable for " + continuityConditions + ".";
        };

        return new FutureCareDtos.DeteriorationInsightResponse(
                patient.getId(),
                patient.getUser().getFullName(),
                predictedScore,
                predictedRiskLevel,
                summary,
                factors,
                recommendedActions,
                abnormalObservationCount,
                activeCaregiverCount
        );
    }

    @Override
    public FutureCareDtos.CopilotRecommendationResponse getCopilotRecommendations(Long patientId) {
        Patient patient = findPatient(patientId);
        FutureCareDtos.DeteriorationInsightResponse deterioration = getDeteriorationInsight(patientId);
        FutureCareDtos.FollowUpAutopilotResponse autopilot = getFollowUpAutopilot(patientId);
        HealthRecord latestHealth = latestHealth(patientId);
        String continuityConditions = summarizeConditions(patient);

        List<String> patientActions = new ArrayList<>();
        patientActions.add("Log fresh sugar, BP, or SpO2 readings before the next review for " + continuityConditions + ".");
        if (deterioration.predictedRiskLevel() == RiskLevel.HIGH || deterioration.predictedRiskLevel() == RiskLevel.CRITICAL) {
            patientActions.add("Do not skip medicine doses or appointments until the continuity risk score falls below the current " + deterioration.predictedScore() + "/100 level.");
        }
        if (patient.getDiseases() != null && patient.getDiseases().toLowerCase().contains("diabetes")) {
            patientActions.add("Track fasting sugar and meal timing more consistently this week because diabetes is part of the continuity profile.");
        }
        if (latestHealth != null && latestHealth.getBloodPressure() != null && !latestHealth.getBloodPressure().isBlank()) {
            patientActions.add("Use the latest BP reading (" + latestHealth.getBloodPressure() + ") as the baseline for the next review.");
        }

        List<String> caregiverActions = new ArrayList<>();
        caregiverActions.add("Confirm the latest reminder and monitoring tasks were completed before " + autopilot.nextFollowUpDate() + ".");
        if (deterioration.activeCaregiverCount() > 1) {
            caregiverActions.add("Coordinate with the wider family network if the patient becomes unreachable.");
        }
        if (autopilot.urgencyLabel().contains("Priority") || autopilot.urgencyLabel().contains("Urgent")) {
            caregiverActions.add("Help schedule the follow-up immediately and watch symptoms closely.");
        }

        List<String> doctorActions = new ArrayList<>();
        doctorActions.add("Review the latest continuity pattern before the next consult, including " + deterioration.contributingFactors().size() + " active risk factor(s).");
        if (deterioration.abnormalObservationCount() > 0) {
            doctorActions.add("Assess " + deterioration.abnormalObservationCount() + " abnormal observation upload(s) for specialist referral need.");
        }
        if (deterioration.predictedRiskLevel() == RiskLevel.CRITICAL) {
            doctorActions.add("Consider urgent in-person escalation or hospital referral.");
        }

        String escalationDecision = deterioration.predictedRiskLevel() == RiskLevel.CRITICAL
                ? "Urgent escalation pathway recommended."
                : deterioration.predictedRiskLevel() == RiskLevel.HIGH
                ? "Priority doctor review recommended."
                : "Continue guided continuity monitoring.";

        return new FutureCareDtos.CopilotRecommendationResponse(
                "TeleCare+ Care Co-Pilot",
                patientActions,
                caregiverActions,
                doctorActions,
                escalationDecision
        );
    }

    @Override
    public FutureCareDtos.AdaptiveTriageResponse getAdaptiveTriage(Long patientId) {
        Patient patient = findPatient(patientId);
        List<String> questions = new ArrayList<>();
        List<String> rationaleBits = new ArrayList<>();
        String diseases = patient.getDiseases() == null ? "" : patient.getDiseases().toLowerCase();
        HealthRecord latestHealth = latestHealth(patientId);
        TriageAssessment latestTriage = triageAssessmentRepository.findByPatientIdOrderByAssessedAtDesc(patientId).stream().findFirst().orElse(null);

        if (diseases.contains("diabetes")) {
            questions.add("What were your latest fasting and post-meal sugar readings?");
            questions.add("Are you having excessive thirst, frequent urination, or dizziness?");
            rationaleBits.add("Diabetes continuity needs symptom plus sugar-context questions.");
        }
        if (diseases.contains("hypertension")) {
            questions.add("Do you have severe headache, blurred vision, or very high blood pressure today?");
            rationaleBits.add("Hypertension history requires blood pressure red-flag screening.");
        }
        if (latestHealth != null && latestHealth.getSpo2() != null && latestHealth.getSpo2() < 95) {
            questions.add("Has your oxygen stayed low or are you breathless on minimal activity?");
            rationaleBits.add("Recent SpO2 trend (" + latestHealth.getSpo2() + "%) suggests respiratory follow-up questions.");
        }
        if (latestHealth != null && latestHealth.getPulse() != null && latestHealth.getPulse() > 110) {
            questions.add("Are you feeling palpitations, faintness, or chest discomfort?");
            rationaleBits.add("Elevated pulse (" + latestHealth.getPulse() + ") suggests cardiac symptom screening.");
        }
        if (latestTriage != null && latestTriage.getLevel() != TriageLevel.ROUTINE_CONSULTATION) {
            questions.add("Since your last triage, have symptoms become more severe or frequent?");
            rationaleBits.add("Previous non-routine triage outcome requires escalation-focused review.");
        }
        questions.add("Is a caregiver available right now if urgent help is needed?");
        if (questions.isEmpty()) {
            questions.add("What symptom is bothering you most right now?");
            questions.add("When did it start and is it getting worse?");
        }

        return new FutureCareDtos.AdaptiveTriageResponse(
                "Adaptive triage suggestions",
                rationaleBits.isEmpty()
                        ? "Questions are tuned from continuity history and recent monitoring signals."
                        : String.join(" ", rationaleBits),
                questions
        );
    }

    @Override
    public FutureCareDtos.FamilyNetworkResponse getPatientFamilyNetwork(Long patientId) {
        Patient patient = findPatient(patientId);
        List<FutureCareDtos.CaregiverMemberResponse> caregivers = linkRepository.findByPatientIdAndActiveTrue(patientId).stream()
                .map(link -> new FutureCareDtos.CaregiverMemberResponse(
                        link.getCaregiver().getId(),
                        link.getCaregiver().getUser().getFullName(),
                        link.getCaregiver().getRelationshipLabel(),
                        link.getCaregiver().getUser().getPhone()
                ))
                .toList();
        boolean multiCaregiverSupport = caregivers.size() > 1;
        String coordinationNote = multiCaregiverSupport
                ? "Multiple caregivers are available to divide medicine, monitoring, and escalation tasks."
                : caregivers.isEmpty()
                ? "No caregiver network is linked yet."
                : "Single caregiver continuity support is active for " + patient.getUser().getFullName() + ".";
        String escalationAdvice = caregivers.isEmpty()
                ? "Link a caregiver to strengthen emergency follow-through."
                : multiCaregiverSupport
                ? "Use the shared family network to assign monitoring and emergency actions."
                : "Caregiver support is available for reminders, alerts, and follow-up coordination.";

        return new FutureCareDtos.FamilyNetworkResponse(
                patient.getId(),
                patient.getUser().getFullName(),
                caregivers,
                multiCaregiverSupport,
                coordinationNote,
                escalationAdvice
        );
    }

    @Override
    public FutureCareDtos.CaregiverFamilyNetworkResponse getCaregiverFamilyNetwork(Long caregiverId) {
        Caregiver caregiver = caregiverRepository.findById(caregiverId)
                .orElseThrow(() -> new ResourceNotFoundException("Caregiver not found"));
        List<FutureCareDtos.CaregiverLinkedFamilyResponse> linkedPatients = linkRepository.findByCaregiverIdAndActiveTrue(caregiverId).stream()
                .map(link -> {
                    Patient patient = link.getPatient();
                    List<FutureCareDtos.CaregiverMemberResponse> caregivers = linkRepository.findByPatientIdAndActiveTrue(patient.getId()).stream()
                            .map(patientLink -> new FutureCareDtos.CaregiverMemberResponse(
                                    patientLink.getCaregiver().getId(),
                                    patientLink.getCaregiver().getUser().getFullName(),
                                    patientLink.getCaregiver().getRelationshipLabel(),
                                    patientLink.getCaregiver().getUser().getPhone()
                            ))
                            .toList();
                    return new FutureCareDtos.CaregiverLinkedFamilyResponse(
                            patient.getId(),
                            patient.getUser().getFullName(),
                            caregivers,
                            caregivers.size() > 1
                                    ? "Shared caregiver network can divide monitoring, medicine, and emergency escalation."
                                    : "Only one caregiver is currently linked to this patient.",
                            caregivers.size() > 1
                    );
                })
                .toList();

        return new FutureCareDtos.CaregiverFamilyNetworkResponse(
                caregiver.getId(),
                caregiver.getUser().getFullName(),
                linkedPatients
        );
    }

    @Override
    public List<FutureCareDtos.ObservationResponse> getPatientObservations(Long patientId) {
        findPatient(patientId);
        return patientObservationRepository.findByPatientIdOrderByMeasuredAtDesc(patientId).stream()
                .map(this::toObservationResponse)
                .toList();
    }

    @Override
    public FutureCareDtos.ObservationResponse createObservation(FutureCareDtos.ObservationRequest request) {
        Patient patient = findPatient(request.patientId());
        Doctor doctor = request.doctorId() == null ? null : doctorRepository.findById(request.doctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        PatientObservation observation = new PatientObservation();
        observation.setPatient(patient);
        observation.setDoctor(doctor);
        observation.setSource(request.source());
        observation.setObservationType(request.observationType());
        observation.setMetricName(request.metricName());
        observation.setMetricValue(request.metricValue());
        observation.setUnit(request.unit());
        boolean isCritical = vitalThresholdService.isCritical(request.metricName(), request.metricValue());
        
        observation.setAbnormalFlag(Boolean.TRUE.equals(request.abnormalFlag()) || isCritical);
        observation.setNotes(request.notes());
        observation.setMeasuredAt(request.measuredAt() == null ? LocalDateTime.now() : request.measuredAt());
        
        PatientObservation savedObservation = patientObservationRepository.save(observation);
        
        if (isCritical) {
            eventPublisher.publishVitalLogged(new VitalLoggedEvent(
                    patient.getId(),
                    request.metricName(),
                    request.metricValue(),
                    request.unit(),
                    savedObservation.getMeasuredAt(),
                    true
            ));
        }
        
        return toObservationResponse(savedObservation);
    }

    @Override
    public FutureCareDtos.FollowUpAutopilotResponse getFollowUpAutopilot(Long patientId) {
        findPatient(patientId);
        FutureCareDtos.DeteriorationInsightResponse deterioration = getDeteriorationInsight(patientId);
        ConsultationNote latestConsultation = consultationNoteRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream().findFirst().orElse(null);

        LocalDate nextFollowUpDate;
        String urgencyLabel;
        if (deterioration.predictedRiskLevel() == RiskLevel.CRITICAL) {
            nextFollowUpDate = LocalDate.now().plusDays(1);
            urgencyLabel = "Urgent follow-up";
        } else if (deterioration.predictedRiskLevel() == RiskLevel.HIGH) {
            nextFollowUpDate = LocalDate.now().plusDays(3);
            urgencyLabel = "Priority follow-up";
        } else if (latestConsultation != null && latestConsultation.getFollowUpDate() != null) {
            nextFollowUpDate = latestConsultation.getFollowUpDate();
            urgencyLabel = "Planned follow-up";
        } else {
            nextFollowUpDate = LocalDate.now().plusDays(14);
            urgencyLabel = "Routine follow-up";
        }

        List<String> tasks = new ArrayList<>();
        tasks.add("Keep medication reminders updated every day until " + nextFollowUpDate + ".");
        tasks.add("Add at least one fresh health reading before the next review on " + nextFollowUpDate + ".");
        if (!linkRepository.findByPatientIdAndActiveTrue(patientId).isEmpty()) {
            tasks.add("Confirm caregiver check-in before the follow-up date.");
        }
        if (carePlanRepository.countByPatientIdAndActiveTrue(patientId) > 0) {
            tasks.add("Review your active care plan and follow the warning thresholds.");
        }

        List<String> reasons = new ArrayList<>();
        reasons.add("Follow-up timing is based on continuity risk (" + deterioration.predictedRiskLevel().name() + ") and active care gaps.");
        if (latestConsultation != null && latestConsultation.getFollowUpDate() != null) {
            reasons.add("Latest doctor consultation already includes a follow-up target of " + latestConsultation.getFollowUpDate() + ".");
        }
        if (deterioration.abnormalObservationCount() > 0) {
            reasons.add("Abnormal lab or wearable observations shortened the review interval.");
        }

        return new FutureCareDtos.FollowUpAutopilotResponse(nextFollowUpDate, urgencyLabel, tasks, reasons);
    }

    @Override
    public List<FutureCareDtos.ReferralSuggestionResponse> getReferralSuggestions(Long doctorId) {
        doctorRepository.findById(doctorId).orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
        return uniquePatientsForDoctor(doctorId).stream()
                .map(patient -> {
                    FutureCareDtos.DeteriorationInsightResponse deterioration = getDeteriorationInsight(patient.getId());
                    HealthRecord latestHealth = latestHealth(patient.getId());
                    TriageAssessment latestTriage = triageAssessmentRepository.findByPatientIdOrderByAssessedAtDesc(patient.getId()).stream().findFirst().orElse(null);
                    String specialty = suggestedSpecialty(patient, latestHealth, latestTriage);
                    ReferralUrgency urgency = deterioration.predictedRiskLevel() == RiskLevel.CRITICAL
                            ? ReferralUrgency.URGENT
                            : deterioration.predictedRiskLevel() == RiskLevel.HIGH
                            ? ReferralUrgency.PRIORITY
                            : ReferralUrgency.ROUTINE;
                    String rationale = latestTriage != null && latestTriage.getLevel() == TriageLevel.IN_PERSON_VISIT_RECOMMENDED
                            ? "Recent triage already indicates in-person escalation."
                            : "Referral suggestion is based on continuity risk, chronic disease burden, and recent monitoring signals.";
                    String facility = urgency == ReferralUrgency.URGENT ? "Nearest emergency-linked hospital" : "Specialist outpatient clinic";
                    return new FutureCareDtos.ReferralSuggestionResponse(
                            patient.getId(),
                            patient.getUser().getFullName(),
                            specialty,
                            urgency,
                            rationale,
                            facility
                    );
                })
                .sorted(Comparator.comparing((FutureCareDtos.ReferralSuggestionResponse item) -> item.urgency().ordinal()).reversed())
                .toList();
    }

    @Override
    public FutureCareDtos.ReferralResponse createReferral(FutureCareDtos.ReferralRequest request) {
        Doctor doctor = doctorRepository.findById(request.doctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
        Patient patient = findPatient(request.patientId());
        Appointment appointment = request.appointmentId() == null ? null : appointmentRepository.findById(request.appointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        ReferralRecommendation referral = new ReferralRecommendation();
        referral.setDoctor(doctor);
        referral.setPatient(patient);
        referral.setAppointment(appointment);
        referral.setSpecialty(request.specialty());
        referral.setTargetFacility(request.targetFacility());
        referral.setReason(request.reason());
        referral.setRecommendationNote(request.recommendationNote());
        referral.setUrgency(request.urgency());
        referral.setStatus(ReferralStatus.SUGGESTED);
        referral.setRecommendedDate(request.recommendedDate() == null ? LocalDate.now().plusDays(3) : request.recommendedDate());
        return toReferralResponse(referralRecommendationRepository.save(referral));
    }

    @Override
    public List<FutureCareDtos.ReferralResponse> getDoctorReferrals(Long doctorId) {
        doctorRepository.findById(doctorId).orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
        return referralRecommendationRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId).stream()
                .map(this::toReferralResponse)
                .toList();
    }

    @Override
    public List<FutureCareDtos.PopulationInsightResponse> getPopulationInsights(Long doctorId) {
        doctorRepository.findById(doctorId).orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
        List<Patient> patients = uniquePatientsForDoctor(doctorId);
        long highRisk = patients.stream()
                .filter(patient -> {
                    RiskLevel level = dashboardService.getPatientDashboard(patient.getId()).riskLevel();
                    return level == RiskLevel.HIGH || level == RiskLevel.CRITICAL;
                })
                .count();
        long lowAdherence = patients.stream()
                .filter(patient -> reminderService.getAdherenceSummary(patient.getId()).adherencePercentage() < 70)
                .count();
        long criticalAlerts = patients.stream()
                .flatMap(patient -> alertNotificationRepository.findByPatientIdAndActiveTrueOrderByCreatedAtDesc(patient.getId()).stream())
                .filter(alert -> alert.getSeverity() == AlertSeverity.CRITICAL)
                .count();
        long activeCarePlans = patients.stream()
                .filter(patient -> carePlanRepository.countByPatientIdAndActiveTrue(patient.getId()) > 0)
                .count();
        long uploadedObservations = patients.stream()
                .mapToLong(patient -> patientObservationRepository.countByPatientId(patient.getId()))
                .sum();
        long generatedReferrals = referralRecommendationRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId).size();

        // Calculate Pattern Alerts (e.g., Respiratory Cluster)
        long respiratoryIssues = patients.stream()
                .flatMap(patient -> triageAssessmentRepository.findByPatientIdOrderByAssessedAtDesc(patient.getId()).stream().limit(1))
                .filter(t -> t.getSymptoms() != null && (t.getSymptoms().toLowerCase().contains("cough") || t.getSymptoms().toLowerCase().contains("fever") || t.getSymptoms().toLowerCase().contains("breath")))
                .filter(t -> t.getAssessedAt().isAfter(java.time.LocalDateTime.now().minusDays(7)))
                .count();

        List<FutureCareDtos.PopulationInsightResponse> insights = new ArrayList<>();
        if (respiratoryIssues >= 2) {
            insights.add(new FutureCareDtos.PopulationInsightResponse(
                    "Respiratory Cluster Alert",
                    String.valueOf(respiratoryIssues),
                    "Recent triage logs show a spike in fever/cough symptoms among your patients in the last 7 days."
            ));
        }
        insights.add(new FutureCareDtos.PopulationInsightResponse(
                "Monitored patients",
                String.valueOf(patients.size()),
                "Unique patients under this doctor's continuity view."
        ));
        insights.add(new FutureCareDtos.PopulationInsightResponse(
                "High-risk patients",
                String.valueOf(highRisk),
                "Patients currently ranked HIGH or CRITICAL by continuity risk."
        ));
        insights.add(new FutureCareDtos.PopulationInsightResponse(
                "Low-adherence cohort",
                String.valueOf(lowAdherence),
                "Patients below 70% medication adherence."
        ));
        insights.add(new FutureCareDtos.PopulationInsightResponse(
                "Critical alerts",
                String.valueOf(criticalAlerts),
                "Open critical escalation items needing rapid review."
        ));
        insights.add(new FutureCareDtos.PopulationInsightResponse(
                "Care plan coverage",
                patients.isEmpty() ? "0%" : Math.round((activeCarePlans * 100.0) / patients.size()) + "%",
                "Patients with an active structured care plan."
        ));
        insights.add(new FutureCareDtos.PopulationInsightResponse(
                "Lab and wearable uploads",
                String.valueOf(uploadedObservations),
                "Observation entries captured from labs, wearables, or manual uploads."
        ));
        insights.add(new FutureCareDtos.PopulationInsightResponse(
                "Referrals created",
                String.valueOf(generatedReferrals),
                "Referral intelligence records generated by this doctor."
        ));
        return insights;
    }

    private Patient findPatient(Long patientId) {
        return patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
    }

    private HealthRecord latestHealth(Long patientId) {
        return healthRecordRepository.findTop10ByPatientIdOrderByRecordedAtDesc(patientId).stream().findFirst().orElse(null);
    }

    private FutureCareDtos.ObservationResponse toObservationResponse(PatientObservation observation) {
        return new FutureCareDtos.ObservationResponse(
                observation.getId(),
                observation.getPatient().getId(),
                observation.getPatient().getUser().getFullName(),
                observation.getDoctor() == null ? null : observation.getDoctor().getId(),
                observation.getDoctor() == null ? null : observation.getDoctor().getUser().getFullName(),
                observation.getSource(),
                observation.getObservationType(),
                observation.getMetricName(),
                observation.getMetricValue(),
                observation.getUnit(),
                observation.isAbnormalFlag(),
                observation.getNotes(),
                observation.getMeasuredAt(),
                observation.getCreatedAt()
        );
    }

    private FutureCareDtos.ReferralResponse toReferralResponse(ReferralRecommendation referral) {
        return new FutureCareDtos.ReferralResponse(
                referral.getId(),
                referral.getDoctor().getId(),
                referral.getDoctor().getUser().getFullName(),
                referral.getPatient().getId(),
                referral.getPatient().getUser().getFullName(),
                referral.getAppointment() == null ? null : referral.getAppointment().getId(),
                referral.getSpecialty(),
                referral.getTargetFacility(),
                referral.getReason(),
                referral.getRecommendationNote(),
                referral.getUrgency(),
                referral.getStatus(),
                referral.getRecommendedDate(),
                referral.getCreatedAt()
        );
    }

    private List<Patient> uniquePatientsForDoctor(Long doctorId) {
        Map<Long, Patient> unique = new LinkedHashMap<>();
        appointmentRepository.findByDoctorIdOrderByAppointmentDateTimeDesc(doctorId)
                .forEach(appointment -> unique.putIfAbsent(appointment.getPatient().getId(), appointment.getPatient()));
        return new ArrayList<>(unique.values());
    }

    private String suggestedSpecialty(Patient patient, HealthRecord latestHealth, TriageAssessment latestTriage) {
        String diseases = patient.getDiseases() == null ? "" : patient.getDiseases().toLowerCase();
        if (latestTriage != null && latestTriage.getLevel() == TriageLevel.EMERGENCY_GO_TO_HOSPITAL) {
            return "Emergency Medicine";
        }
        if (diseases.contains("diabetes")) {
            return "Endocrinology";
        }
        if (diseases.contains("hypertension") || (latestHealth != null && latestHealth.getBloodPressure() != null && latestHealth.getBloodPressure().startsWith("1"))) {
            return "Cardiology";
        }
        if (latestHealth != null && latestHealth.getSpo2() != null && latestHealth.getSpo2() < 95) {
            return "Pulmonology";
        }
        return "General Medicine";
    }

    private RiskLevel toRiskLevel(int score) {
        if (score >= 75) {
            return RiskLevel.CRITICAL;
        }
        if (score >= 50) {
            return RiskLevel.HIGH;
        }
        if (score >= 25) {
            return RiskLevel.MODERATE;
        }
        return RiskLevel.LOW;
    }

    private String summarizeConditions(Patient patient) {
        if (patient.getDiseases() == null || patient.getDiseases().isBlank()) {
            return "general continuity monitoring";
        }
        return patient.getDiseases().replace(",", " and").trim();
    }

    private String compactVitalSummary(HealthRecord latestHealth) {
        List<String> parts = new ArrayList<>();
        if (latestHealth.getBloodPressure() != null && !latestHealth.getBloodPressure().isBlank()) {
            parts.add("BP " + latestHealth.getBloodPressure());
        }
        if (latestHealth.getSugar() != null) {
            parts.add("Sugar " + latestHealth.getSugar().intValue());
        }
        if (latestHealth.getSpo2() != null) {
            parts.add("SpO2 " + latestHealth.getSpo2().intValue());
        }
        if (latestHealth.getPulse() != null) {
            parts.add("Pulse " + latestHealth.getPulse().intValue());
        }
        return parts.isEmpty() ? "recent monitoring data" : String.join(", ", parts);
    }
}
