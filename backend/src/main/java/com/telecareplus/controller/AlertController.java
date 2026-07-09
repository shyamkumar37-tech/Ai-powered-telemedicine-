package com.telecareplus.controller;

import com.telecareplus.dto.AlertDtos;
import com.telecareplus.service.AlertService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public List<AlertDtos.AlertResponse> patientAlerts(@PathVariable Long patientId) {
        return alertService.getPatientAlerts(patientId);
    }

    @GetMapping(value = "/patient/{patientId}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public SseEmitter patientAlertStream(@PathVariable Long patientId) {
        return alertService.streamPatientAlerts(patientId);
    }

    @GetMapping("/caregiver/{caregiverId}")
    @PreAuthorize("hasRole('CAREGIVER') and @accessScopeAuthorizer.canAccessCaregiver(authentication, #caregiverId)")
    public List<AlertDtos.AlertResponse> caregiverAlerts(@PathVariable Long caregiverId) {
        return alertService.getCaregiverAlerts(caregiverId);
    }

    @GetMapping(value = "/caregiver/{caregiverId}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize("hasRole('CAREGIVER') and @accessScopeAuthorizer.canAccessCaregiver(authentication, #caregiverId)")
    public SseEmitter caregiverAlertStream(@PathVariable Long caregiverId) {
        return alertService.streamCaregiverAlerts(caregiverId);
    }

    @PatchMapping("/{alertId}/action")
    @PreAuthorize("hasAnyRole('PATIENT', 'CAREGIVER')")
    public AlertDtos.AlertResponse actionAlert(@PathVariable Long alertId, @RequestParam String action) {
        return alertService.actionAlert(alertId, action);
    }
}
