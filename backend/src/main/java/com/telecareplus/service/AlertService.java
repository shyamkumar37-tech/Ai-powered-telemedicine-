package com.telecareplus.service;

import com.telecareplus.dto.AlertDtos;
import com.telecareplus.entity.enums.AlertSeverity;
import java.util.List;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

public interface AlertService {
    List<AlertDtos.AlertResponse> getPatientAlerts(Long patientId);
    List<AlertDtos.AlertResponse> getCaregiverAlerts(Long caregiverId);
    AlertDtos.AlertResponse createAlert(Long patientId, AlertSeverity severity, String message);
    SseEmitter streamPatientAlerts(Long patientId);
    SseEmitter streamCaregiverAlerts(Long caregiverId);
}
