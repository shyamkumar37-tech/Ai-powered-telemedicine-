package com.telecareplus.service.impl;

import com.telecareplus.dto.DashboardDtos;
import com.telecareplus.entity.AlertNotification;
import com.telecareplus.entity.HealthRecord;
import com.telecareplus.entity.Patient;
import com.telecareplus.entity.TriageAssessment;
import com.telecareplus.entity.enums.AlertSeverity;
import com.telecareplus.entity.enums.AppointmentStatus;
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
import com.telecareplus.repository.MedicationReminderRepository;
import com.telecareplus.repository.PatientCaregiverLinkRepository;
import com.telecareplus.repository.PatientRepository;
import com.telecareplus.repository.PrescriptionRepository;
import com.telecareplus.repository.TriageAssessmentRepository;
import com.telecareplus.service.DashboardService;
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
    private final AlertNotificationRepository alertNotificationRepository;
    private final TriageAssessmentRepository triageAssessmentRepository;
    private final ConsultationNoteRepository consultationNoteRepository;
    private final PatientCaregiverLinkRepository linkRepository;
    private final CarePlanRepository carePlanRepository;
    private final HealthRecordRepository healthRecordRepository;
    private final MedicationReminderRepository medicationReminderRepository;

    @Override
    public DashboardDtos.DashboardSummaryResponse getPatientDashboard(Long patientId) {
        var patient = patientRepository.findById(patientId).orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        LocalDate today = LocalDate.now();
        var adherence = reminderService.getAdherenceSummary(patientId);
        var latestTriage = triageAssessmentRepository.findTopByPatientIdOrderByAssessedAtDesc(patientId);
        var activeAlerts = alertNotificationRepository.findByPatientIdAndActiveTrueOrderByCreatedAtDesc(patientId);
        var latestHealth = healthRecordRepository.findTopByPatientIdOrderByRecordedAtDesc(patientId);
        int riskScore = calculatePatientRiskScore(patient, adherence.adherencePercentage(), activeAlerts, latestTriage, latestHealth);
        return new DashboardDtos.DashboardSummaryResponse(
                appointmentRepository.countByPatientId(patientId),
                appointmentRepository.countByPatientIdAndStatusIn(patientId, List.of(AppointmentStatus.BOOKED, AppointmentStatus.REQUESTED, AppointmentStatus.CONFIRMED)),
                prescriptionRepository.countByPatientId(patientId),
                medicationReminderRepository.countEffectivePendingByPatientId(patientId, today),
                adherence.adherencePercentage(),
                latestTriage == null ? "No triage yet" : latestTriage.getLevel().name(),
                consultationNoteRepository.countByPatientIdAndFollowUpDateGreaterThanEqual(patientId, today),
                activeAlerts.stream().map(a -> a.getSeverity() + ": " + a.getMessage()).limit(4).toList(),
                riskScore,
                toRiskLevel(riskScore),
                carePlanRepository.countByPatientIdAndActiveTrue(patientId)
        );
    }

    @Override
    public DashboardDtos.DashboardSummaryResponse getDoctorDashboard(Long doctorId) {
        doctorRepository.findById(doctorId).orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
        var appointments = appointmentRepository.findByDoctorIdOrderByAppointmentDateTimeDesc(doctorId);
        
        List<Long> patientIds = appointments.stream().map(a -> a.getPatient().getId()).distinct().toList();
        var criticalAlerts = alertNotificationRepository.findAll().stream()
                .filter(a -> patientIds.contains(a.getPatient().getId()) && a.isActive() && a.getSeverity() == AlertSeverity.CRITICAL)
                .limit(4)
                .map(a -> a.getPatient().getUser().getFullName() + " - CRITICAL: " + a.getMessage())
                .toList();
        
        var alertsToReturn = criticalAlerts.isEmpty() ?
                appointments.stream().filter(a -> a.getTriageAssessment() != null)
                        .limit(4)
                        .map(a -> a.getPatient().getUser().getFullName() + " - " + a.getTriageAssessment().getLevel().name())
                        .toList() : criticalAlerts;

        return new DashboardDtos.DashboardSummaryResponse(
                appointments.size(),
                appointments.stream().filter(a -> a.getStatus() == AppointmentStatus.BOOKED || a.getStatus() == AppointmentStatus.REQUESTED || a.getStatus() == AppointmentStatus.CONFIRMED).count(),
                appointments.stream().filter(a -> a.getStatus() == AppointmentStatus.COMPLETED).count(),
                0,
                0,
                "Patients with triage: " + appointments.stream().filter(a -> a.getTriageAssessment() != null).count(),
                0,
                alertsToReturn,
                0,
                RiskLevel.LOW,
                0
        );
    }

    @Override
    public DashboardDtos.DashboardSummaryResponse getCaregiverDashboard(Long caregiverId) {
        caregiverRepository.findById(caregiverId).orElseThrow(() -> new ResourceNotFoundException("Caregiver not found"));
        var links = linkRepository.findByCaregiverIdAndActiveTrue(caregiverId);
        long appointments = links.stream().mapToLong(l -> appointmentRepository.findByPatientIdOrderByAppointmentDateTimeDesc(l.getPatient().getId()).size()).sum();
        long pendingReminders = links.stream().mapToLong(l -> reminderService.getPatientReminders(l.getPatient().getId()).stream().filter(r -> r.status() == ReminderStatus.PENDING).count()).sum();
        double adherence = links.isEmpty() ? 0.0 : links.stream().mapToDouble(l -> reminderService.getAdherenceSummary(l.getPatient().getId()).adherencePercentage()).average().orElse(0.0);
        return new DashboardDtos.DashboardSummaryResponse(
                appointments,
                0,
                0,
                pendingReminders,
                adherence,
                "Linked patients: " + links.size(),
                0,
                links.stream()
                        .flatMap(l -> alertNotificationRepository.findByPatientIdAndActiveTrueOrderByCreatedAtDesc(l.getPatient().getId()).stream())
                        .map(a -> a.getSeverity() + ": " + a.getMessage())
                        .limit(5)
                        .toList(),
                0,
                RiskLevel.MODERATE,
                0
        );
    }

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
                .mapToInt(a -> a.getSeverity() == AlertSeverity.CRITICAL ? 25 : a.getSeverity() == AlertSeverity.WARNING ? 15 : 5)
                .sum();
        if (latestTriage != null) {
            switch (latestTriage.getLevel()) {
                case EMERGENCY_GO_TO_HOSPITAL -> score += 30;
                case IN_PERSON_VISIT_RECOMMENDED -> score += 20;
                case PRIORITY_CONSULTATION -> score += 10;
                default -> score += 3;
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
