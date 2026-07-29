package com.telecareplus.clinical;

import com.telecareplus.users.Caregiver;
import com.telecareplus.users.Patient;

import com.telecareplus.clinical.CaregiverInterventionDtos;
import com.telecareplus.clinical.CaregiverIntervention;
import com.telecareplus.clinical.CaregiverInterventionStatus;
import com.telecareplus.common.ResourceNotFoundException;

import com.telecareplus.clinical.CaregiverInterventionRepository;
import com.telecareplus.users.CaregiverRepository;
import com.telecareplus.users.PatientRepository;
import com.telecareplus.clinical.CaregiverInterventionService;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CaregiverInterventionServiceImpl implements CaregiverInterventionService {

    private final CaregiverInterventionRepository caregiverInterventionRepository;
    private final CaregiverRepository caregiverRepository;
    private final PatientRepository patientRepository;

    @Override
    public CaregiverInterventionDtos.CaregiverInterventionResponse create(CaregiverInterventionDtos.CaregiverInterventionRequest request) {
        var caregiver = caregiverRepository.findById(request.caregiverId())
                .orElseThrow(() -> new ResourceNotFoundException("Caregiver not found"));
        var patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        CaregiverIntervention intervention = new CaregiverIntervention();
        intervention.setCaregiver(caregiver);
        intervention.setPatient(patient);
        intervention.setActionType(request.actionType());
        intervention.setStatus(CaregiverInterventionStatus.OPEN);
        intervention.setWellbeingStatus(request.wellbeingStatus());
        intervention.setNotes(request.notes().trim());
        intervention.setFollowUpNeeded(request.followUpNeeded() != null && request.followUpNeeded());
        intervention.setActionAt(LocalDateTime.now());
        if (request.alertNotificationId() != null) {
            intervention.setAlertNotificationId(request.alertNotificationId());
        }

        return toResponse(caregiverInterventionRepository.save(intervention));
    }

    @Override
    public List<CaregiverInterventionDtos.CaregiverInterventionResponse> listByCaregiver(Long caregiverId) {
        return caregiverInterventionRepository.findByCaregiverIdOrderByActionAtDesc(caregiverId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public CaregiverInterventionDtos.CaregiverInterventionResponse updateStatus(Long interventionId, CaregiverInterventionDtos.CaregiverInterventionStatusRequest request) {
        CaregiverIntervention intervention = caregiverInterventionRepository.findById(interventionId)
                .orElseThrow(() -> new ResourceNotFoundException("Intervention not found"));
        intervention.setStatus(request.status());
        return toResponse(caregiverInterventionRepository.save(intervention));
    }

    private CaregiverInterventionDtos.CaregiverInterventionResponse toResponse(CaregiverIntervention intervention) {
        return new CaregiverInterventionDtos.CaregiverInterventionResponse(
                intervention.getId(),
                intervention.getCaregiver().getId(),
                intervention.getPatient().getId(),
                intervention.getPatient().getUser().getFullName(),
                intervention.getAlertNotificationId(),
                null,
                null,
                intervention.getActionType(),
                intervention.getStatus(),
                intervention.getWellbeingStatus(),
                intervention.getNotes(),
                intervention.isFollowUpNeeded(),
                intervention.getActionAt()
        );
    }
}
