package com.telecareplus.security;

import com.telecareplus.entity.enums.RoleType;
import com.telecareplus.repository.AppointmentRepository;
import com.telecareplus.repository.CareMessageRepository;
import com.telecareplus.repository.CaregiverInterventionRepository;
import com.telecareplus.repository.CaregiverRepository;
import com.telecareplus.repository.ConsultationNoteRepository;
import com.telecareplus.repository.DispenseRecordRepository;
import com.telecareplus.repository.DoctorRepository;
import com.telecareplus.repository.MedicationReminderRepository;
import com.telecareplus.repository.PatientCaregiverLinkRepository;
import com.telecareplus.repository.PatientRepository;
import com.telecareplus.repository.PharmacistRepository;
import com.telecareplus.repository.PrescriptionRepository;
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

    public boolean canSendPatientMessage(Authentication authentication, Long patientId, Long senderUserId) {
        CustomUserPrincipal principal = extractPrincipal(authentication);
        if (principal == null || patientId == null || senderUserId == null) {
            return false;
        }
        return principal.getUserId().equals(senderUserId) && canAccessPatientCare(authentication, patientId);
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
