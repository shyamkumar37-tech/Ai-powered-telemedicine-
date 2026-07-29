package com.telecareplus.authentication;

import com.telecareplus.users.CustomUserPrincipal;

import com.telecareplus.common.RoleType;
import com.telecareplus.appointments.AppointmentRepository;
import com.telecareplus.notification.AlertNotificationRepository;
import com.telecareplus.clinical.CareMessageRepository;
import com.telecareplus.clinical.CaregiverInterventionRepository;
import com.telecareplus.users.CaregiverRepository;
import com.telecareplus.clinical.ConsultationNoteRepository;
import com.telecareplus.pharmacy.DispenseRecordRepository;
import com.telecareplus.users.DoctorRepository;
import com.telecareplus.pharmacy.MedicationReminderRepository;
import com.telecareplus.users.PatientCaregiverLinkRepository;
import com.telecareplus.users.PatientRepository;
import com.telecareplus.users.PharmacistRepository;
import com.telecareplus.pharmacy.PrescriptionRepository;
import com.telecareplus.clinical.TriageAssessmentRepository;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("accessScopeAuthorizer")
@RequiredArgsConstructor
public class AccessScopeAuthorizer {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final CaregiverRepository caregiverRepository;
    private final PharmacistRepository pharmacistRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientCaregiverLinkRepository patientCaregiverLinkRepository;
    private final MedicationReminderRepository medicationReminderRepository;
    private final CaregiverInterventionRepository caregiverInterventionRepository;
    private final CareMessageRepository careMessageRepository;
    private final ConsultationNoteRepository consultationNoteRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final DispenseRecordRepository dispenseRecordRepository;
    private final TriageAssessmentRepository triageAssessmentRepository;
    private final AlertNotificationRepository alertNotificationRepository;

    public boolean canAccessPatient(Authentication authentication, Long patientId) {
        CustomUserPrincipal principal = extractPrincipal(authentication);
        if (principal == null || patientId == null) {
            return false;
        }
        if (principal.getRole() == RoleType.ADMIN) {
            return true;
        }
        if (principal.getRole() != RoleType.PATIENT) {
            return false;
        }
        return patientRepository.existsByIdAndUserId(patientId, principal.getUserId());
    }

    public boolean canAccessDoctor(Authentication authentication, Long doctorId) {
        CustomUserPrincipal principal = extractPrincipal(authentication);
        if (principal == null || doctorId == null) {
            return false;
        }
        if (principal.getRole() == RoleType.ADMIN) {
            return true;
        }
        if (principal.getRole() != RoleType.DOCTOR) {
            return false;
        }
        return doctorRepository.existsByIdAndUserId(doctorId, principal.getUserId());
    }

    public boolean canAccessCaregiver(Authentication authentication, Long caregiverId) {
        CustomUserPrincipal principal = extractPrincipal(authentication);
        if (principal == null || caregiverId == null) {
            return false;
        }
        if (principal.getRole() == RoleType.ADMIN) {
            return true;
        }
        if (principal.getRole() != RoleType.CAREGIVER) {
            return false;
        }
        return caregiverRepository.existsByIdAndUserId(caregiverId, principal.getUserId());
    }

    public boolean canAccessPharmacist(Authentication authentication, Long pharmacistId) {
        CustomUserPrincipal principal = extractPrincipal(authentication);
        if (principal == null || pharmacistId == null) {
            return false;
        }
        if (principal.getRole() == RoleType.ADMIN) {
            return true;
        }
        if (principal.getRole() != RoleType.PHARMACIST) {
            return false;
        }
        return pharmacistRepository.existsByIdAndUserId(pharmacistId, principal.getUserId());
    }

    public boolean canAccessPatientCare(Authentication authentication, Long patientId) {
        CustomUserPrincipal principal = extractPrincipal(authentication);
        if (principal == null || patientId == null) {
            return false;
        }
        return switch (principal.getRole()) {
            case ADMIN -> true;
            case PATIENT -> patientRepository.existsByIdAndUserId(patientId, principal.getUserId());
            case DOCTOR -> appointmentRepository.existsByPatientIdAndDoctorUserId(patientId, principal.getUserId());
            case CAREGIVER -> patientCaregiverLinkRepository.hasActivePatientAccess(patientId, principal.getUserId(), Instant.now());
            case PHARMACIST -> dispenseRecordRepository.existsByPatientIdAndPharmacistUserId(patientId, principal.getUserId());
            default -> false;
        };
    }

    public boolean canAccessDoctorPatient(Authentication authentication, Long doctorId, Long patientId) {
        CustomUserPrincipal principal = extractPrincipal(authentication);
        if (principal == null || doctorId == null || patientId == null) {
            return false;
        }
        if (principal.getRole() == RoleType.ADMIN) {
            return true;
        }
        return principal.getRole() == RoleType.DOCTOR
                && doctorRepository.existsByIdAndUserId(doctorId, principal.getUserId())
                && appointmentRepository.existsByPatientIdAndDoctorUserId(patientId, principal.getUserId());
    }

    public boolean canCreateCaregiverLink(Authentication authentication, Long patientId, Long caregiverId) {
        CustomUserPrincipal principal = extractPrincipal(authentication);
        if (principal == null || patientId == null || caregiverId == null) {
            return false;
        }
        if (principal.getRole() == RoleType.ADMIN) {
            return true;
        }
        return principal.getRole() == RoleType.CAREGIVER
                && caregiverRepository.existsByIdAndUserId(caregiverId, principal.getUserId())
                && patientCaregiverLinkRepository.hasActivePatientAccess(patientId, principal.getUserId(), Instant.now());
    }

    public boolean canCreateAppointment(Authentication authentication, Long patientId, Long triageAssessmentId) {
        if (!canAccessPatient(authentication, patientId)) {
            return false;
        }
        return triageAssessmentId == null || triageAssessmentRepository.existsByIdAndPatientId(triageAssessmentId, patientId);
    }

    public boolean canReferencePatientAlert(Authentication authentication, Long patientId, Long alertNotificationId) {
        if (!canAccessPatientCare(authentication, patientId)) {
            return false;
        }
        return alertNotificationId == null || alertNotificationRepository.existsByIdAndPatientId(alertNotificationId, patientId);
    }

    public boolean canReferenceDoctorPatientAppointment(Authentication authentication, Long doctorId, Long patientId, Long appointmentId) {
        if (!canAccessDoctorPatient(authentication, doctorId, patientId)) {
            return false;
        }
        return appointmentId == null || appointmentRepository.existsByIdAndPatientIdAndDoctorId(appointmentId, patientId, doctorId);
    }

    public boolean canCreatePatientObservation(Authentication authentication, Long patientId, Long doctorId) {
        CustomUserPrincipal principal = extractPrincipal(authentication);
        if (principal == null || patientId == null) {
            return false;
        }
        if (principal.getRole() == RoleType.PATIENT) {
            return patientRepository.existsByIdAndUserId(patientId, principal.getUserId());
        }
        if (principal.getRole() == RoleType.DOCTOR) {
            return doctorId != null
                    && doctorRepository.existsByIdAndUserId(doctorId, principal.getUserId())
                    && appointmentRepository.existsByPatientIdAndDoctorUserId(patientId, principal.getUserId());
        }
        return principal.getRole() == RoleType.ADMIN;
    }

    public boolean canAccessReminder(Authentication authentication, Long reminderId) {
        CustomUserPrincipal principal = extractPrincipal(authentication);
        if (principal == null || reminderId == null) {
            return false;
        }
        if (principal.getRole() == RoleType.ADMIN) {
            return true;
        }
        return principal.getRole() == RoleType.PATIENT
                && medicationReminderRepository.existsByIdAndPatientUserId(reminderId, principal.getUserId());
    }

    public boolean canAccessCaregiverIntervention(Authentication authentication, Long interventionId) {
        CustomUserPrincipal principal = extractPrincipal(authentication);
        if (principal == null || interventionId == null) {
            return false;
        }
        if (principal.getRole() == RoleType.ADMIN) {
            return true;
        }
        return principal.getRole() == RoleType.CAREGIVER
                && caregiverInterventionRepository.existsByIdAndCaregiverUserId(interventionId, principal.getUserId());
    }

    public boolean canSendPatientMessage(Authentication authentication, Long patientId, Long senderUserId, Long recipientUserId) {
        CustomUserPrincipal principal = extractPrincipal(authentication);
        if (principal == null || patientId == null || senderUserId == null || recipientUserId == null) {
            return false;
        }
        return principal.getUserId().equals(senderUserId)
                && canAccessPatientCare(authentication, patientId)
                && canMessageRecipientForPatient(patientId, recipientUserId);
    }

    private boolean canMessageRecipientForPatient(Long patientId, Long recipientUserId) {
        Instant now = Instant.now();
        return patientRepository.existsByIdAndUserId(patientId, recipientUserId)
                || appointmentRepository.existsByPatientIdAndDoctorUserId(patientId, recipientUserId)
                || patientCaregiverLinkRepository.hasActivePatientAccess(patientId, recipientUserId, now)
                || dispenseRecordRepository.existsByPatientIdAndPharmacistUserId(patientId, recipientUserId);
    }

    public boolean canAccessMessage(Authentication authentication, Long messageId) {
        CustomUserPrincipal principal = extractPrincipal(authentication);
        if (principal == null || messageId == null) {
            return false;
        }
        if (principal.getRole() == RoleType.ADMIN) {
            return true;
        }
        return careMessageRepository.existsByIdAndParticipantUserId(messageId, principal.getUserId());
    }

    public boolean canAccessConsultation(Authentication authentication, Long consultationId) {
        CustomUserPrincipal principal = extractPrincipal(authentication);
        if (principal == null || consultationId == null) {
            return false;
        }
        if (principal.getRole() == RoleType.ADMIN) {
            return true;
        }
        return principal.getRole() == RoleType.DOCTOR
                && consultationNoteRepository.existsByIdAndDoctorUserId(consultationId, principal.getUserId());
    }

    public boolean canAccessDoctorAppointmentConsultation(Authentication authentication, Long appointmentId) {
        CustomUserPrincipal principal = extractPrincipal(authentication);
        if (principal == null || appointmentId == null) {
            return false;
        }
        if (principal.getRole() == RoleType.ADMIN) {
            return true;
        }
        return principal.getRole() == RoleType.DOCTOR
                && (appointmentRepository.existsByIdAndDoctorUserId(appointmentId, principal.getUserId())
                    || consultationNoteRepository.existsByAppointmentIdAndDoctorUserId(appointmentId, principal.getUserId()));
    }

    public boolean canAccessPrescription(Authentication authentication, Long prescriptionId) {
        CustomUserPrincipal principal = extractPrincipal(authentication);
        if (principal == null || prescriptionId == null) {
            return false;
        }
        if (principal.getRole() == RoleType.ADMIN) {
            return true;
        }
        return prescriptionRepository.existsByIdAndPatientOrDoctorUserId(prescriptionId, principal.getUserId());
    }

    public boolean canAccessConsultationPrescription(Authentication authentication, Long consultationNoteId) {
        CustomUserPrincipal principal = extractPrincipal(authentication);
        if (principal == null || consultationNoteId == null) {
            return false;
        }
        if (principal.getRole() == RoleType.ADMIN) {
            return true;
        }
        return principal.getRole() == RoleType.DOCTOR
                && (consultationNoteRepository.existsByIdAndDoctorUserId(consultationNoteId, principal.getUserId())
                    || prescriptionRepository.existsByConsultationNoteIdAndDoctorUserId(consultationNoteId, principal.getUserId()));
    }

    public boolean canAccessDispenseRecord(Authentication authentication, Long dispenseRecordId) {
        CustomUserPrincipal principal = extractPrincipal(authentication);
        if (principal == null || dispenseRecordId == null) {
            return false;
        }
        if (principal.getRole() == RoleType.ADMIN) {
            return true;
        }
        return principal.getRole() == RoleType.PHARMACIST
                && dispenseRecordRepository.existsByIdAndPharmacistUserId(dispenseRecordId, principal.getUserId());
    }

    public boolean canAccessDoctorAppointment(Authentication authentication, Long appointmentId) {
        CustomUserPrincipal principal = extractPrincipal(authentication);
        if (principal == null || appointmentId == null) {
            return false;
        }
        if (principal.getRole() == RoleType.ADMIN) {
            return true;
        }
        if (principal.getRole() != RoleType.DOCTOR) {
            return false;
        }
        return appointmentRepository.existsByIdAndDoctorUserId(appointmentId, principal.getUserId());
    }

    private CustomUserPrincipal extractPrincipal(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        if (!(authentication.getPrincipal() instanceof CustomUserPrincipal principal)) {
            return null;
        }
        return principal;
    }
}
