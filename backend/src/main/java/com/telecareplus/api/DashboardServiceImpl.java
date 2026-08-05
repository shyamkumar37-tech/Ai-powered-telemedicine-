package com.telecareplus.api;

import com.telecareplus.pharmacy.ReminderServiceImpl;
import com.telecareplus.api.DashboardDtos;
import com.telecareplus.notification.AlertNotification;
import com.telecareplus.clinical.HealthRecord;
import com.telecareplus.users.Patient;
import com.telecareplus.clinical.TriageAssessment;
import com.telecareplus.common.AlertSeverity;
import com.telecareplus.appointments.AppointmentStatus;
import com.telecareplus.clinical.RiskLevel;
import com.telecareplus.common.ResourceNotFoundException;
import com.telecareplus.notification.AlertNotificationRepository;
import com.telecareplus.appointments.AppointmentRepository;
import com.telecareplus.clinical.CarePlanRepository;
import com.telecareplus.users.CaregiverRepository;
import com.telecareplus.clinical.ConsultationNoteRepository;
import com.telecareplus.users.DoctorRepository;
import com.telecareplus.clinical.HealthRecordRepository;
import com.telecareplus.users.PatientCaregiverLinkRepository;
import com.telecareplus.users.PatientRepository;
import com.telecareplus.pharmacy.PrescriptionRepository;
import com.telecareplus.clinical.TriageAssessmentRepository;
import com.telecareplus.api.DashboardService;
import com.telecareplus.jooq.query.DashboardAnalyticsQuery;
import com.telecareplus.jooq.query.DoctorDashboardQuery;
import com.telecareplus.jooq.query.CaregiverDashboardQuery;

import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final CaregiverRepository caregiverRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final ReminderServiceImpl reminderService;
    private final DashboardAnalyticsQuery dashboardAnalyticsQuery;
    private final DoctorDashboardQuery doctorDashboardQuery;
    private final CaregiverDashboardQuery caregiverDashboardQuery;
    private final PatientCaregiverLinkRepository linkRepository;
    private final AlertNotificationRepository alertNotificationRepository;
    private final TriageAssessmentRepository triageAssessmentRepository;
    private final ConsultationNoteRepository consultationNoteRepository;
    private final CarePlanRepository carePlanRepository;
    private final HealthRecordRepository healthRecordRepository;

    // ------------------------------------------------------------------ //
    //  Patient Dashboard                                                   //
    // ------------------------------------------------------------------ //

    @Override
    public DashboardDtos.DashboardSummaryResponse getPatientDashboard(Long patientId) {
        var patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        LocalDate today = LocalDate.now();

        var adherence   = reminderService.getAdherenceSummary(patientId);
        var latestTriage = triageAssessmentRepository.findTopByPatientIdOrderByAssessedAtDesc(patientId);
        var activeAlerts = alertNotificationRepository.findByPatientIdAndActiveTrueOrderByCreatedAtDesc(patientId);
        var latestHealth = healthRecordRepository.findTopByPatientIdOrderByRecordedAtDesc(patientId);
        int riskScore   = calculatePatientRiskScore(patient, adherence.adherencePercentage(), activeAlerts, latestTriage, latestHealth);

        var analytics = dashboardAnalyticsQuery.getPatientMetrics(patientId);

        return new DashboardDtos.DashboardSummaryResponse(
                analytics.appointmentCount(),
                appointmentRepository.countByPatientIdAndStatusIn(patientId,
                        List.of(AppointmentStatus.BOOKED, AppointmentStatus.REQUESTED, AppointmentStatus.CONFIRMED)),
                analytics.prescriptionCount(),
                analytics.medicationReminderCount(),
                adherence.adherencePercentage(),
                latestTriage == null ? "No triage yet" : latestTriage.getLevel().name(),
                consultationNoteRepository.countByPatientIdAndFollowUpDateGreaterThanEqual(patientId, today),
                activeAlerts.stream().map(a -> a.getSeverity() + ": " + a.getMessage()).limit(4).toList(),
                riskScore,
                toRiskLevel(riskScore),
                carePlanRepository.countByPatientIdAndActiveTrue(patientId)
        );
    }

    // ------------------------------------------------------------------ //
    //  Doctor Dashboard                                                    //
    // ------------------------------------------------------------------ //

    @Override
    public DashboardDtos.DashboardSummaryResponse getDoctorDashboard(Long doctorId) {
        doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        int total     = doctorDashboardQuery.countTotalAppointments(doctorId);
        int pending   = doctorDashboardQuery.countPendingAppointments(doctorId);
        int completed = doctorDashboardQuery.countCompletedAppointments(doctorId);
        int triaged   = doctorDashboardQuery.countTriagedPatients(doctorId);
        int critical  = doctorDashboardQuery.countPatientsWithCriticalAlerts(doctorId);

        List<String> alertSummary = critical > 0
                ? List.of(critical + " patient(s) have active CRITICAL alerts")
                : List.of("No critical alerts for your patients right now");

        return new DashboardDtos.DashboardSummaryResponse(
                total,
                pending,
                completed,
                0,
                0,
                "Patients with triage on record: " + triaged,
                0,
                alertSummary,
                0,
                RiskLevel.LOW,
                0
        );
    }

    // ------------------------------------------------------------------ //
    //  Caregiver Dashboard                                                 //
    // ------------------------------------------------------------------ //

    @Override
    public DashboardDtos.DashboardSummaryResponse getCaregiverDashboard(Long caregiverId) {
        caregiverRepository.findById(caregiverId)
                .orElseThrow(() -> new ResourceNotFoundException("Caregiver not found"));

        // jOOQ counts – replaces N+1 JPA loops
        int linkedPatients   = caregiverDashboardQuery.countLinkedPatients(caregiverId);
        int totalAppts       = caregiverDashboardQuery.countLinkedPatientAppointments(caregiverId);
        int pendingReminders = caregiverDashboardQuery.countPendingReminders(caregiverId);

        // Adherence still needs reminder service logic; computed once via linkRepository
        var links = linkRepository.findByCaregiverIdAndActiveTrue(caregiverId);
        double adherence = links.isEmpty() ? 0.0
                : links.stream()
                        .mapToDouble(l -> reminderService.getAdherenceSummary(l.getPatient().getId()).adherencePercentage())
                        .average()
                        .orElse(0.0);

        return new DashboardDtos.DashboardSummaryResponse(
                totalAppts,
                0,
                0,
                pendingReminders,
                adherence,
                "Linked patients: " + linkedPatients,
                0,
                List.of(),
                0,
                RiskLevel.MODERATE,
                0
        );
    }

    // ------------------------------------------------------------------ //
    //  Helpers                                                             //
    // ------------------------------------------------------------------ //

    private int calculatePatientRiskScore(
            Patient patient,
            double adherencePercentage,
            List<AlertNotification> activeAlerts,
            TriageAssessment latestTriage,
            HealthRecord latestHealth
    ) {
        int score = 0;
        // Age check removed as it's now DOB String, implement properly later
        if (patient.getDiseases() != null && !patient.getDiseases().isBlank()) {
            score += 10;
            if (patient.getDiseases().contains(",")) {
                score += 10;
            }
        }
        score += (int) activeAlerts.stream()
                .mapToInt(a -> a.getSeverity() == AlertSeverity.CRITICAL ? 25
                        : a.getSeverity() == AlertSeverity.WARNING ? 15 : 5)
                .sum();
        if (latestTriage != null) {
            switch (latestTriage.getLevel()) {
                case EMERGENCY_GO_TO_HOSPITAL   -> score += 30;
                case IN_PERSON_VISIT_RECOMMENDED -> score += 20;
                case PRIORITY_CONSULTATION       -> score += 10;
                default                          -> score += 3;
            }
        }
        if (adherencePercentage < 50) {
            score += 15;
        } else if (adherencePercentage < 75) {
            score += 8;
        }
        if (latestHealth != null && latestHealth.getAlertSeverity() == AlertSeverity.CRITICAL) {
            score += 25;
        } else if (latestHealth != null && latestHealth.getAlertSeverity() == AlertSeverity.WARNING) {
            score += 12;
        }
        return Math.min(score, 100);
    }

    private RiskLevel toRiskLevel(int score) {
        if (score >= 75) return RiskLevel.CRITICAL;
        if (score >= 50) return RiskLevel.HIGH;
        if (score >= 25) return RiskLevel.MODERATE;
        return RiskLevel.LOW;
    }
}
