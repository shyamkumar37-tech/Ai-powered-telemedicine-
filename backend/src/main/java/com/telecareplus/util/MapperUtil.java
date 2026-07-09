package com.telecareplus.util;

import com.telecareplus.dto.AppointmentDtos;
import com.telecareplus.dto.ConsultationDtos;
import com.telecareplus.dto.HealthDtos;
import com.telecareplus.dto.PrescriptionDtos;
import com.telecareplus.dto.ProfileDtos;
import com.telecareplus.dto.ReminderDtos;
import com.telecareplus.dto.TriageDtos;
import com.telecareplus.entity.*;
import java.util.List;

public final class MapperUtil {

    private MapperUtil() {
    }

    public static ProfileDtos.UserSummary toUserSummary(User user) {
        return new ProfileDtos.UserSummary(user.getId(), user.getFullName(), user.getEmail(), user.getPhone(), user.getPreferredLanguage());
    }

    public static ProfileDtos.PatientProfileResponse toPatientProfile(Patient patient) {
        return new ProfileDtos.PatientProfileResponse(
                patient.getId(), toUserSummary(patient.getUser()), patient.getAge(), patient.getGender(), patient.getBloodGroup(),
                patient.getAllergies(), patient.getDiseases(), patient.getEmergencyContactName(), patient.getEmergencyContactPhone(),
                patient.getMedicalHistorySummary()
        );
    }

    public static ProfileDtos.DoctorProfileResponse toDoctorProfile(Doctor doctor) {
        return new ProfileDtos.DoctorProfileResponse(
                doctor.getId(), toUserSummary(doctor.getUser()), doctor.getSpecialization(), doctor.getExperienceYears(),
                doctor.getConsultationFee(), doctor.getQualification(),
                doctor.getAvailabilitySummary(), doctor.getBio()
        );
    }

    public static ProfileDtos.CaregiverProfileResponse toCaregiverProfile(Caregiver caregiver) {
        return new ProfileDtos.CaregiverProfileResponse(caregiver.getId(), toUserSummary(caregiver.getUser()), caregiver.getRelationshipLabel());
    }

    public static TriageDtos.TriageResponse toTriageResponse(TriageAssessment triage) {
        return new TriageDtos.TriageResponse(triage.getId(), triage.getLevel(), triage.getRecommendation(), triage.getSymptoms(), triage.getAssessedAt());
    }

    public static AppointmentDtos.AppointmentResponse toAppointmentResponse(Appointment appointment) {
        return new AppointmentDtos.AppointmentResponse(
                appointment.getId(),
                appointment.getPatient().getId(),
                appointment.getPatient().getUser().getFullName(),
                appointment.getDoctor().getId(),
                appointment.getDoctor().getUser().getFullName(),
                appointment.getAppointmentDateTime(),
                appointment.getStatus(),
                appointment.getMode(),
                appointment.getConcernSummary(),
                appointment.getTriageAssessment() != null ? appointment.getTriageAssessment().getLevel().name() : null
        );
    }

    public static ConsultationDtos.ConsultationNoteResponse toConsultationResponse(ConsultationNote note) {
        return new ConsultationDtos.ConsultationNoteResponse(
                note.getId(), note.getAppointment().getId(), note.getDoctor().getUser().getFullName(),
                note.getPatient().getUser().getFullName(), note.getNotes(), note.getOutcome(), note.getFollowUpDate(),
                note.getAiGenerated(), note.getReviewedAt(), note.getReviewedBy()
        );
    }

    public static PrescriptionDtos.PrescriptionResponse toPrescriptionResponse(Prescription prescription, List<MedicationItem> items) {
        return new PrescriptionDtos.PrescriptionResponse(
                prescription.getId(),
                prescription.getPatient().getId(),
                prescription.getPatient().getUser().getFullName(),
                prescription.getDoctor().getUser().getFullName(),
                prescription.getNotes(),
                prescription.getFollowUpDate(),
                items.stream().map(item -> new PrescriptionDtos.MedicationItemResponse(
                        item.getId(), item.getMedicineName(), item.getDosage(), item.getFrequency(), item.getDurationDays(), item.getNotes()
                )).toList()
        );
    }

    public static ReminderDtos.ReminderResponse toReminderResponse(MedicationReminder reminder) {
        return new ReminderDtos.ReminderResponse(
                reminder.getId(),
                reminder.getMedicationItem().getMedicineName(),
                reminder.getMedicationItem().getDosage(),
                reminder.getMedicationItem().getFrequency(),
                reminder.getScheduledDate(),
                reminder.getStatus()
        );
    }

    public static HealthDtos.HealthRecordResponse toHealthResponse(HealthRecord record) {
        return new HealthDtos.HealthRecordResponse(
                record.getId(), record.getBloodPressure(), record.getSugar(), record.getWeight(), record.getSpo2(),
                record.getPulse(), record.getTemperature(), record.getAlertSeverity(), record.getAlertMessage(), record.getRecordedAt()
        );
    }
}
