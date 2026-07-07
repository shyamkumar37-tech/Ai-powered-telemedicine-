package com.telecareplus.service.impl;

import com.telecareplus.dto.CaregiverInterventionDtos;
import com.telecareplus.entity.CaregiverIntervention;
import com.telecareplus.entity.enums.CaregiverInterventionStatus;
import com.telecareplus.exception.ResourceNotFoundException;
import com.telecareplus.repository.AlertNotificationRepository;
import com.telecareplus.repository.CaregiverInterventionRepository;
import com.telecareplus.repository.CaregiverRepository;
import com.telecareplus.repository.PatientRepository;
import com.telecareplus.service.CaregiverInterventionService;
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
    private final AlertNotificationRepository alertNotificationRepository;

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
            intervention.setAlertNotification(alertNotificationRepository.findById(request.alertNotificationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Alert not found")));
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
                intervention.getAlertNotification() != null ? intervention.getAlertNotification().getId() : null,
                intervention.getAlertNotification() != null ? intervention.getAlertNotification().getSeverity() : null,
                intervention.getAlertNotification() != null ? intervention.getAlertNotification().getMessage() : null,
                intervention.getActionType(),
                intervention.getStatus(),
                intervention.getWellbeingStatus(),
                intervention.getNotes(),
                intervention.isFollowUpNeeded(),
                intervention.getActionAt()
        );
    }
}
