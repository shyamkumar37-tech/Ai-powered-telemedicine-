package com.telecareplus.service.communication;

import com.telecareplus.dto.AlertDtos;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

public interface AlertStreamService {
    SseEmitter registerPatientStream(Long patientId);
    SseEmitter registerCaregiverStream(Long caregiverId);
    void publishToPatient(Long patientId, AlertDtos.AlertResponse alert);
    void publishToCaregiver(Long caregiverId, AlertDtos.AlertResponse alert);
}
