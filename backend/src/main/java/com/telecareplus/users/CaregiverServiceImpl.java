package com.telecareplus.users;



import com.telecareplus.users.CaregiverDtos;
import com.telecareplus.users.PatientCaregiverLink;

import com.telecareplus.common.BadRequestException;
import com.telecareplus.common.ResourceNotFoundException;

import com.telecareplus.users.CaregiverRepository;
import com.telecareplus.users.PatientCaregiverLinkRepository;
import com.telecareplus.users.PatientRepository;
import com.telecareplus.users.CaregiverService;

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
    private final org.springframework.context.ApplicationEventPublisher applicationEventPublisher;

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
                .map(link -> new CaregiverDtos.LinkedPatientResponse(
                        link.getPatient().getId(),
                        link.getPatient().getUser().getFullName()
                ))
                .toList();
    }

    @Override
    public void inviteCaregiver(CaregiverDtos.CaregiverInviteRequest request) {
        var patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        
        String token = java.util.UUID.randomUUID().toString();
        // In a real app we'd save this token to the database.
        
        String inviteLink = "http://localhost:5173/register/caregiver?token=" + token + "&patientId=" + request.patientId();


        try {
            applicationEventPublisher.publishEvent(CaregiverInvitedEvent.builder()
                    .patientId(patient.getId())
                    .patientName(patient.getUser().getFullName())
                    .caregiverEmail(request.email())
                    .relationship(request.relationship())
                    .inviteLink(inviteLink)
                    .build());
        } catch (Exception e) {
            // Log the error but don't fail the transaction, as the invitation token is generated
            System.err.println("Failed to publish caregiver invitation event: " + e.getMessage());
            // In a production scenario, we would use a proper logger and a retry queue
        }
    }
}
