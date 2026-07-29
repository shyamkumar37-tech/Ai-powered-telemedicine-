package com.telecareplus.notification;

import com.telecareplus.notification.AlertDtos;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

public interface AlertStreamService {
    SseEmitter registerPatientStream(Long patientId);
    SseEmitter registerCaregiverStream(Long caregiverId);
    void publishToPatient(Long patientId, AlertDtos.AlertResponse alert);
    void publishToCaregiver(Long caregiverId, AlertDtos.AlertResponse alert);
}
