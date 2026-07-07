package com.telecareplus.service.impl;

import com.telecareplus.dto.IntelligenceDtos;
import com.telecareplus.entity.enums.AlertSeverity;
import com.telecareplus.entity.enums.ReminderStatus;
import com.telecareplus.entity.enums.RiskLevel;
import com.telecareplus.exception.ResourceNotFoundException;
import com.telecareplus.repository.AlertNotificationRepository;
import com.telecareplus.repository.AppointmentRepository;
import com.telecareplus.repository.CarePlanRepository;
import com.telecareplus.repository.CaregiverRepository;
import com.telecareplus.repository.ConsultationNoteRepository;
import com.telecareplus.repository.DoctorRepository;
import com.telecareplus.repository.HealthRecordRepository;
import com.telecareplus.repository.PatientCaregiverLinkRepository;
import com.telecareplus.repository.PatientRepository;
import com.telecareplus.repository.PrescriptionRepository;
import com.telecareplus.repository.TriageAssessmentRepository;
import com.telecareplus.service.IntelligenceService;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class IntelligenceServiceImpl implements IntelligenceService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final CaregiverRepository caregiverRepository;
    private final AppointmentRepository appointmentRepository;
    private final TriageAssessmentRepository triageAssessmentRepository;
    private final ConsultationNoteRepository consultationNoteRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final HealthRecordRepository healthRecordRepository;
    private final AlertNotificationRepository alertNotificationRepository;
    private final PatientCaregiverLinkRepository linkRepository;
    private final CarePlanRepository carePlanRepository;
    private final ReminderServiceImpl reminderService;
    private final DashboardServiceImpl dashboardService;

    @Override
    public List<IntelligenceDtos.TimelineEventResponse> getPatientTimeline(Long patientId) {
        patientRepository.findById(patientId).orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        List<IntelligenceDtos.TimelineEventResponse> timeline = new ArrayList<>();

        triageAssessmentRepository.findByPatientIdOrderByAssessedAtDesc(patientId).forEach(item ->
                timeline.add(new IntelligenceDtos.TimelineEventResponse(
                        "TRIAGE",
                        "Triage assessed as " + item.getLevel().name().replace('_', ' '),
                        item.getRecommendation(),
                        toSeverity(item.getLevel().name()),
                        item.getAssessedAt())));

        appointmentRepository.findByPatientIdOrderByAppointmentDateTimeDesc(patientId).forEach(item ->
                timeline.add(new IntelligenceDtos.TimelineEventResponse(
                        "APPOINTMENT",
                        "Appointment " + item.getStatus().name(),
                        item.getDoctor().getUser().getFullName() + " | " + item.getConcernSummary(),
                        null,
                        item.getAppointmentDateTime())));

        consultationNoteRepository.findByPatientIdOrderByCreatedAtDesc(patientId).forEach(item ->
                timeline.add(new IntelligenceDtos.TimelineEventResponse(
                        "CONSULTATION",
                        "Consultation outcome: " + item.getOutcome().name().replace('_', ' '),
                        item.getNotes(),
                        null,
                        item.getCreatedAt())));

        prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patientId).forEach(item ->
                timeline.add(new IntelligenceDtos.TimelineEventResponse(
                        "PRESCRIPTION",
                        "Prescription issued by " + item.getDoctor().getUser().getFullName(),
                        item.getNotes(),
                        null,
                        item.getCreatedAt())));

        healthRecordRepository.findTop10ByPatientIdOrderByRecordedAtDesc(patientId).forEach(item ->
                timeline.add(new IntelligenceDtos.TimelineEventResponse(
                        "HEALTH",
                        "Health reading captured",
                        "BP " + safe(item.getBloodPressure()) + " | Sugar " + safe(item.getSugar()) + " | SpO2 " + safe(item.getSpo2()),
                        item.getAlertSeverity(),
                        item.getRecordedAt())));

        alertNotificationRepository.findByPatientIdAndActiveTrueOrderByCreatedAtDesc(patientId).forEach(item ->
                timeline.add(new IntelligenceDtos.TimelineEventResponse(
                        "ALERT",
                        item.getSeverity().name() + " alert",
                        item.getMessage(),
                        item.getSeverity(),
                        item.getCreatedAt())));

        return timeline.stream()
                .sorted(Comparator.comparing(IntelligenceDtos.TimelineEventResponse::occurredAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(30)
                .toList();
    }

    @Override
    public IntelligenceDtos.CareComplianceResponse getCareCompliance(Long patientId) {
        patientRepository.findById(patientId).orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        var adherence = reminderService.getAdherenceSummary(patientId);
        long missedCount = reminderService.getPatientReminders(patientId).stream().filter(item -> item.status() == ReminderStatus.MISSED).count();
        long openAlerts = alertNotificationRepository.findByPatientIdAndActiveTrueOrderByCreatedAtDesc(patientId).size();
        int recentReadings = healthRecordRepository.findTop10ByPatientIdOrderByRecordedAtDesc(patientId).size();
        long activeCarePlans = carePlanRepository.countByPatientIdAndActiveTrue(patientId);

        int score = (int) Math.max(0,
                Math.min(100,
                        adherence.adherencePercentage()
                                + (recentReadings >= 3 ? 10 : recentReadings * 3)
                                + (activeCarePlans > 0 ? 10 : 0)
                                - (missedCount * 8)
                                - (openAlerts * 6)));

        return new IntelligenceDtos.CareComplianceResponse(
                adherence.adherencePercentage(),
                missedCount,
                openAlerts,
                recentReadings,
                activeCarePlans,
                score,
                score >= 80 ? "Strong" : score >= 55 ? "Needs support" : "High risk gap"
        );
    }

    @Override
    public List<IntelligenceDtos.DoctorPriorityPatientResponse> getDoctorPriorityQueue(Long doctorId) {
        doctorRepository.findById(doctorId).orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
        return appointmentRepository.findByDoctorIdOrderByAppointmentDateTimeDesc(doctorId).stream()
                .map(item -> item.getPatient())
                .distinct()
                .map(patient -> {
                    var dashboard = dashboardService.getPatientDashboard(patient.getId());
                    long pendingReminders = reminderService.getPatientReminders(patient.getId()).stream()
                            .filter(reminder -> reminder.status() == ReminderStatus.PENDING)
                            .count();
                    String latestAlert = dashboard.recentHealthAlerts().isEmpty() ? "No active alert" : dashboard.recentHealthAlerts().get(0);
                    String action = dashboard.riskLevel() == RiskLevel.CRITICAL
                            ? "Arrange urgent review or in-person escalation"
                            : dashboard.adherencePercentage() < 60
                            ? "Review adherence and caregiver support"
                            : "Continue continuity follow-up";

                    return new IntelligenceDtos.DoctorPriorityPatientResponse(
                            patient.getId(),
                            patient.getUser().getFullName(),
                            dashboard.riskScore(),
                            dashboard.riskLevel(),
                            dashboard.adherencePercentage(),
                            pendingReminders,
                            latestAlert,
                            action
                    );
                })
                .sorted(Comparator.comparing(IntelligenceDtos.DoctorPriorityPatientResponse::riskScore).reversed())
                .toList();
    }

    @Override
    public List<IntelligenceDtos.MissedCareGapResponse> getCaregiverCareGaps(Long caregiverId) {
        caregiverRepository.findById(caregiverId).orElseThrow(() -> new ResourceNotFoundException("Caregiver not found"));
        return linkRepository.findByCaregiverIdAndActiveTrue(caregiverId).stream()
                .flatMap(link -> {
                    var patient = link.getPatient();
                    List<IntelligenceDtos.MissedCareGapResponse> gaps = new ArrayList<>();
                    var reminders = reminderService.getPatientReminders(patient.getId());
                    long missedCount = reminders.stream().filter(item -> item.status() == ReminderStatus.MISSED).count();
                    if (missedCount >= 2) {
                        gaps.add(new IntelligenceDtos.MissedCareGapResponse(
                                patient.getId(),
                                patient.getUser().getFullName(),
                                "MEDICATION_GAP",
                                "Multiple medication doses were missed recently.",
                                AlertSeverity.WARNING,
                                "Check medicine intake and confirm adherence today"
                        ));
                    }
                    int recentReadings = healthRecordRepository.findTop10ByPatientIdOrderByRecordedAtDesc(patient.getId()).size();
                    if (recentReadings == 0) {
                        gaps.add(new IntelligenceDtos.MissedCareGapResponse(
                                patient.getId(),
                                patient.getUser().getFullName(),
                                "MONITORING_GAP",
                                "No recent health readings available.",
                                AlertSeverity.WARNING,
                                "Help patient record BP, sugar, or SpO2 today"
                        ));
                    }
                    if (alertNotificationRepository.findByPatientIdAndActiveTrueOrderByCreatedAtDesc(patient.getId()).stream().anyMatch(alert -> alert.getSeverity() == AlertSeverity.CRITICAL)) {
                        gaps.add(new IntelligenceDtos.MissedCareGapResponse(
                                patient.getId(),
                                patient.getUser().getFullName(),
                                "ESCALATION_GAP",
                                "Critical alert requires caregiver intervention follow-through.",
                                AlertSeverity.CRITICAL,
                                "Call patient immediately and coordinate in-person review"
                        ));
                    }
                    return gaps.stream();
                })
                .sorted(Comparator.comparing((IntelligenceDtos.MissedCareGapResponse gap) -> gap.severity() == AlertSeverity.CRITICAL ? 1 : 0).reversed())
                .toList();
    }

    @Override
    public IntelligenceDtos.PatientEducationResponse getPatientEducation(Long patientId) {
        var patient = patientRepository.findById(patientId).orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        List<String> tips = new ArrayList<>();
        String diseases = patient.getDiseases() == null ? "" : patient.getDiseases().toLowerCase();
        var latestHealth = healthRecordRepository.findTop10ByPatientIdOrderByRecordedAtDesc(patientId).stream().findFirst().orElse(null);
        var latestConsultation = consultationNoteRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream().findFirst().orElse(null);
        long pendingReminders = reminderService.getPatientReminders(patientId).stream()
                .filter(item -> item.status() == ReminderStatus.PENDING)
                .count();
        if (diseases.contains("diabetes")) {
            tips.add(latestHealth != null && latestHealth.getSugar() != null
                    ? "Your latest sugar is " + latestHealth.getSugar().intValue() + " mg/dL, so record fasting and post-meal readings regularly."
                    : "Record sugar readings regularly and avoid skipping diabetic medicine.");
            tips.add("Prefer consistent meal timing and reduce refined sugar intake to stabilize the diabetes profile.");
        }
        if (diseases.contains("hypertension")) {
            tips.add(latestHealth != null && latestHealth.getBloodPressure() != null
                    ? "Your latest blood pressure is " + latestHealth.getBloodPressure() + ", so keep tracking BP regularly and limit excess salt intake."
                    : "Track blood pressure regularly and limit excess salt intake.");
            tips.add("Take antihypertensive medicine at the same time each day unless the doctor changes the schedule.");
        }
        var latestTriage = triageAssessmentRepository.findByPatientIdOrderByAssessedAtDesc(patientId).stream().findFirst().orElse(null);
        if (latestTriage != null && !"ROUTINE_CONSULTATION".equals(latestTriage.getLevel().name())) {
            tips.add("Because your last triage was above routine level, seek earlier follow-up if symptoms worsen.");
        }
        if (pendingReminders > 0) {
            tips.add("You still have " + pendingReminders + " pending medicine reminder(s), so update the reminders page today.");
        }
        if (latestConsultation != null && latestConsultation.getFollowUpDate() != null) {
            tips.add("Your latest consultation follow-up date is " + latestConsultation.getFollowUpDate() + ", so complete readings and reminders before that review.");
        }
        if (carePlanRepository.countByPatientIdAndActiveTrue(patientId) > 0) {
            tips.add("Review your active care plan regularly and follow its warning thresholds and lifestyle guidance.");
        }
        if (tips.isEmpty()) {
            tips.add("Continue regular check-ins, medicine adherence, and follow-up attendance.");
            tips.add("Use the health module to keep your doctor updated with recent readings.");
        }
        String headline = patient.getDiseases() == null || patient.getDiseases().isBlank()
                ? "Personalized self-care guidance"
                : "Personalized self-care guidance for " + patient.getDiseases();
        return new IntelligenceDtos.PatientEducationResponse(headline, tips);
    }

    private AlertSeverity toSeverity(String triageLevel) {
        if ("EMERGENCY_GO_TO_HOSPITAL".equals(triageLevel)) {
            return AlertSeverity.CRITICAL;
        }
        if ("IN_PERSON_VISIT_RECOMMENDED".equals(triageLevel) || "PRIORITY_CONSULTATION".equals(triageLevel)) {
            return AlertSeverity.WARNING;
        }
        return AlertSeverity.INFO;
    }

    private String safe(Object value) {
        return value == null ? "-" : String.valueOf(value);
    }
}
