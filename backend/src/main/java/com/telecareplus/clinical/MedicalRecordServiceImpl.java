package com.telecareplus.clinical;

import com.telecareplus.appointments.AppointmentDtos;
import com.telecareplus.users.ProfileDtos;
import com.telecareplus.pharmacy.Prescription;
import com.telecareplus.pharmacy.MedicationItem;
import com.telecareplus.users.User;
import com.telecareplus.appointments.Appointment;
import com.telecareplus.pharmacy.PrescriptionDtos;

import com.telecareplus.users.Patient;

import com.telecareplus.clinical.MedicalRecordDtos;
import com.telecareplus.common.ResourceNotFoundException;
import com.telecareplus.notification.AlertNotificationRepository;
import com.telecareplus.appointments.AppointmentRepository;
import com.telecareplus.clinical.ConsultationNoteRepository;
import com.telecareplus.pharmacy.MedicationItemRepository;
import com.telecareplus.users.PatientRepository;
import com.telecareplus.pharmacy.PrescriptionRepository;
import com.telecareplus.clinical.TriageAssessmentRepository;
import com.telecareplus.clinical.HealthRecordService;
import com.telecareplus.clinical.MedicalRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MedicalRecordServiceImpl implements MedicalRecordService {

    private final PatientRepository patientRepository;
    private final TriageAssessmentRepository triageAssessmentRepository;
    private final AppointmentRepository appointmentRepository;
    private final ConsultationNoteRepository consultationNoteRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicationItemRepository medicationItemRepository;
    private final HealthRecordService healthRecordService;
    private final AlertNotificationRepository alertNotificationRepository;

    @Override
    public MedicalRecordDtos.PatientMedicalRecordResponse getPatientMedicalRecord(Long patientId) {
        var patient = patientRepository.findById(patientId).orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        return new MedicalRecordDtos.PatientMedicalRecordResponse(
                toPatientProfile(patient),
                triageAssessmentRepository.findByPatientIdOrderByAssessedAtDesc(patientId).stream().map(this::toTriageResponse).toList(),
                appointmentRepository.findByPatientIdOrderByAppointmentDateTimeDesc(patientId).stream().map(this::toAppointmentResponse).toList(),
                consultationNoteRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream().map(this::toConsultationResponse).toList(),
                prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream()
                        .map(prescription -> toPrescriptionResponse(
                                prescription,
                                medicationItemRepository.findByPrescriptionId(prescription.getId())
                        ))
                        .toList(),
                healthRecordService.getPatientRecords(patientId),
                alertNotificationRepository.findByPatientIdAndActiveTrueOrderByCreatedAtDesc(patientId).stream()
                        .map(alert -> new MedicalRecordDtos.AlertResponse(
                                alert.getId(),
                                alert.getSeverity(),
                                alert.getMessage(),
                                alert.isActive()
                        ))
                        .toList()
        );
    }

    private com.telecareplus.users.ProfileDtos.UserSummary toUserSummary(com.telecareplus.users.User user) {
        return new com.telecareplus.users.ProfileDtos.UserSummary(
                user.getId(), user.getFullName(), user.getEmail(), user.getPhone(), user.getPreferredLanguage(),
                user.isEmailNotificationsEnabled(), user.isSmsNotificationsEnabled(), user.isPushNotificationsEnabled()
        );
    }

    private com.telecareplus.users.ProfileDtos.PatientProfileResponse toPatientProfile(Patient patient) {
        return new com.telecareplus.users.ProfileDtos.PatientProfileResponse(
                patient.getId(), toUserSummary(patient.getUser()), patient.getDateOfBirth(), patient.getGender(), patient.getBloodGroup(),
                patient.getAllergies(), patient.getDiseases(), patient.getEmergencyContactName(), patient.getEmergencyContactPhone(),
                patient.getMedicalHistorySummary(), patient.getHeight(), patient.getWeight(), patient.getCurrentMedications(),
                patient.getInsuranceInfo(), patient.isProfileComplete()
        );
    }

    private TriageDtos.TriageResponse toTriageResponse(TriageAssessment triage) {
        return new TriageDtos.TriageResponse(triage.getId(), triage.getLevel(), triage.getRecommendation(), triage.getSymptoms(), triage.getAssessedAt());
    }

    private com.telecareplus.appointments.AppointmentDtos.AppointmentResponse toAppointmentResponse(com.telecareplus.appointments.Appointment appointment) {
        return new com.telecareplus.appointments.AppointmentDtos.AppointmentResponse(
                appointment.getId(),
                appointment.getPatient().getId(),
                appointment.getPatient().getUser().getFullName(),
                appointment.getDoctor().getId(),
                appointment.getDoctor().getUser().getFullName(),
                appointment.getAppointmentDateTime(),
                appointment.getStatus(),
                appointment.getMode(),
                appointment.getConcernSummary(),
                appointment.getTriageAssessmentId() != null ? String.valueOf(appointment.getTriageAssessmentId()) : null
        );
    }

    private ConsultationDtos.ConsultationNoteResponse toConsultationResponse(ConsultationNote note) {
        return new ConsultationDtos.ConsultationNoteResponse(
                note.getId(), note.getAppointment().getId(), note.getDoctor().getUser().getFullName(),
                note.getPatient().getUser().getFullName(), note.getNotes(), note.getOutcome(), note.getFollowUpDate(),
                note.getAiGenerated(), note.getReviewedAt(), note.getReviewedBy()
        );
    }

    private com.telecareplus.pharmacy.PrescriptionDtos.PrescriptionResponse toPrescriptionResponse(com.telecareplus.pharmacy.Prescription prescription, java.util.List<com.telecareplus.pharmacy.MedicationItem> items) {
        return new com.telecareplus.pharmacy.PrescriptionDtos.PrescriptionResponse(
                prescription.getId(),
                prescription.getPatient().getId(),
                prescription.getPatient().getUser().getFullName(),
                prescription.getDoctor().getUser().getFullName(),
                prescription.getNotes(),
                prescription.getFollowUpDate(),
                items.stream().map(item -> new com.telecareplus.pharmacy.PrescriptionDtos.MedicationItemResponse(
                        item.getId(), item.getMedicineName(), item.getDosage(), item.getFrequency(), item.getDurationDays(), item.getNotes()
                )).toList()
        );
    }
}
