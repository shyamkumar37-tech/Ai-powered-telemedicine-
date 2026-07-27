package com.telecareplus.service.impl;

import com.telecareplus.dto.CaregiverDtos;
import com.telecareplus.entity.PatientCaregiverLink;
import com.telecareplus.entity.enums.ReminderStatus;
import com.telecareplus.exception.BadRequestException;
import com.telecareplus.exception.ResourceNotFoundException;
import com.telecareplus.repository.AlertNotificationRepository;
import com.telecareplus.repository.CaregiverRepository;
import com.telecareplus.repository.PatientCaregiverLinkRepository;
import com.telecareplus.repository.PatientRepository;
import com.telecareplus.service.CaregiverService;
import com.telecareplus.service.communication.CommunicationService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CaregiverServiceImpl implements CaregiverService {

    private final PatientCaregiverLinkRepository linkRepository;
    private final PatientRepository patientRepository;
    private final CaregiverRepository caregiverRepository;
    private final AlertNotificationRepository alertNotificationRepository;
    private final ReminderServiceImpl reminderService;
    private final CommunicationService communicationService;

    @Override
    public void linkPatient(CaregiverDtos.CaregiverLinkRequest request) {
        if (linkRepository.existsByPatientIdAndCaregiverIdAndActiveTrue(request.patientId(), request.caregiverId())) {
            throw new BadRequestException("Caregiver already linked to patient");
        }
        var patient = patientRepository.findById(request.patientId()).orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        var caregiver = caregiverRepository.findById(request.caregiverId()).orElseThrow(() -> new ResourceNotFoundException("Caregiver not found"));
        PatientCaregiverLink link = new PatientCaregiverLink();
        link.setPatient(patient);
        link.setCaregiver(caregiver);
        link.setActive(true);
        linkRepository.save(link);
    }

    @Override
    public List<CaregiverDtos.LinkedPatientResponse> getLinkedPatients(Long caregiverId) {
        return linkRepository.findByCaregiverIdAndActiveTrue(caregiverId).stream()
                .map(link -> {
                    var reminders = reminderService.getPatientReminders(link.getPatient().getId());
                    return new CaregiverDtos.LinkedPatientResponse(
                            link.getPatient().getId(),
                            link.getPatient().getUser().getFullName(),
                            reminders.stream().filter(r -> r.status() == ReminderStatus.PENDING).count(),
                            reminderService.getAdherenceSummary(link.getPatient().getId()).adherencePercentage(),
                            alertNotificationRepository.findByPatientIdAndActiveTrueOrderByCreatedAtDesc(link.getPatient().getId()).stream()
                                    .map(alert -> alert.getSeverity() + ": " + alert.getMessage())
                                    .limit(3)
                                    .toList()
                    );
                })
                .toList();
    }

    @Override
    public void inviteCaregiver(CaregiverDtos.CaregiverInviteRequest request) {
        var patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        
        String token = java.util.UUID.randomUUID().toString();
        // In a real app we'd save this token to the database.
        
        String inviteLink = "http://localhost:5173/register/caregiver?token=" + token + "&patientId=" + request.patientId();
        
        String message = String.format("Hello,\n\n%s has invited you to join their Care Network on TeleCare+ as their %s.\n\nPlease click the link below to register and accept the invitation:\n%s\n\n- The TeleCare+ Team",
                patient.getUser().getFullName(), request.relationship(), inviteLink);

        try {
            communicationService.sendEmail(request.email(), "TeleCare+ Caregiver Invitation", message);
        } catch (Exception e) {
            // Log the error but don't fail the transaction, as the invitation token is generated
            System.err.println("Failed to send caregiver invitation email to " + request.email() + ": " + e.getMessage());
            // In a production scenario, we would use a proper logger and a retry queue
        }
    }
}
