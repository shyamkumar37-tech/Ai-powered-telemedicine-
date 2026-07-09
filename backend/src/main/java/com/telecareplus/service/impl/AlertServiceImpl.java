package com.telecareplus.service.impl;

import com.telecareplus.dto.AlertDtos;
import com.telecareplus.entity.AlertNotification;
import com.telecareplus.entity.Caregiver;
import com.telecareplus.entity.PatientCaregiverLink;
import com.telecareplus.entity.enums.AlertSeverity;
import com.telecareplus.exception.ResourceNotFoundException;
import com.telecareplus.repository.AlertNotificationRepository;
import com.telecareplus.repository.PatientRepository;
import com.telecareplus.repository.PatientCaregiverLinkRepository;
import com.telecareplus.service.AlertService;
import com.telecareplus.service.communication.AlertStreamService;
import com.telecareplus.service.communication.CommunicationService;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
@RequiredArgsConstructor
public class AlertServiceImpl implements AlertService {

    private final AlertNotificationRepository alertNotificationRepository;
    private final PatientCaregiverLinkRepository patientCaregiverLinkRepository;
    private final PatientRepository patientRepository;
    private final AlertStreamService alertStreamService;
    private final CommunicationService communicationService;

    @Override
    public List<AlertDtos.AlertResponse> getPatientAlerts(Long patientId) {
        return alertNotificationRepository.findByPatientIdAndActiveTrueOrderByCreatedAtDesc(patientId).stream()
                .map(this::toAlertResponse)
                .toList();
    }

    @Override
    public List<AlertDtos.AlertResponse> getCaregiverAlerts(Long caregiverId) {
        return patientCaregiverLinkRepository.findByCaregiverIdAndActiveTrue(caregiverId).stream()
                .flatMap(link -> alertNotificationRepository.findByPatientIdAndActiveTrueOrderByCreatedAtDesc(link.getPatient().getId()).stream())
                .sorted(Comparator.comparing(alert -> alert.getCreatedAt(), Comparator.reverseOrder()))
                .map(this::toAlertResponse)
                .toList();
    }

    @Override
    public AlertDtos.AlertResponse createAlert(Long patientId, AlertSeverity severity, String message) {
        var patient = patientRepository.findById(patientId).orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        AlertNotification alert = new AlertNotification();
        alert.setPatient(patient);
        alert.setSeverity(severity);
        alert.setMessage(message);
        alert.setActive(true);
        alert = alertNotificationRepository.save(alert);

        AlertDtos.AlertResponse response = toAlertResponse(alert);
        alertStreamService.publishToPatient(patientId, response);

        List<Caregiver> caregivers = patientCaregiverLinkRepository.findByPatientIdAndActiveTrue(patientId).stream()
                .map(PatientCaregiverLink::getCaregiver)
                .toList();
        caregivers.forEach(caregiver -> alertStreamService.publishToCaregiver(caregiver.getId(), response));
        communicationService.dispatchAlertNotifications(patient, caregivers, severity, message, "alert:" + alert.getId());
        return response;
    }

    @Override
    public SseEmitter streamPatientAlerts(Long patientId) {
        return alertStreamService.registerPatientStream(patientId);
    }

    @Override
    public SseEmitter streamCaregiverAlerts(Long caregiverId) {
        return alertStreamService.registerCaregiverStream(caregiverId);
    }

    @Override
    public AlertDtos.AlertResponse actionAlert(Long alertId, String action) {
        AlertNotification alert = alertNotificationRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found"));
        
        if ("acknowledge".equalsIgnoreCase(action) || "dismiss".equalsIgnoreCase(action) || "snooze".equalsIgnoreCase(action)) {
            alert.setActive(false);
            alert = alertNotificationRepository.save(alert);
        }
        
        return toAlertResponse(alert);
    }

    private AlertDtos.AlertResponse toAlertResponse(AlertNotification alert) {
        return new AlertDtos.AlertResponse(
                alert.getId(),
                alert.getPatient().getId(),
                alert.getPatient().getUser().getFullName(),
                alert.getSeverity(),
                alert.getMessage(),
                alert.isActive(),
                alert.getCreatedAt()
        );
    }
}
