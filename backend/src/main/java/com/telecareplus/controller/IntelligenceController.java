package com.telecareplus.controller;

import com.telecareplus.dto.IntelligenceDtos;
import com.telecareplus.service.IntelligenceService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/intelligence")
@RequiredArgsConstructor
public class IntelligenceController {

    private final IntelligenceService intelligenceService;

    @GetMapping("/patient/{patientId}/timeline")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public List<IntelligenceDtos.TimelineEventResponse> patientTimeline(@PathVariable Long patientId) {
        return intelligenceService.getPatientTimeline(patientId);
    }

    @GetMapping("/patient/{patientId}/compliance")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public IntelligenceDtos.CareComplianceResponse patientCompliance(@PathVariable Long patientId) {
        return intelligenceService.getCareCompliance(patientId);
    }

    @GetMapping("/patient/{patientId}/education")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public IntelligenceDtos.PatientEducationResponse patientEducation(@PathVariable Long patientId) {
        return intelligenceService.getPatientEducation(patientId);
    }

    @GetMapping("/doctor/{doctorId}/priority-queue")
    @PreAuthorize("hasRole('DOCTOR') and @accessScopeAuthorizer.canAccessDoctor(authentication, #doctorId)")
    public List<IntelligenceDtos.DoctorPriorityPatientResponse> doctorPriorityQueue(@PathVariable Long doctorId) {
        return intelligenceService.getDoctorPriorityQueue(doctorId);
    }

    @GetMapping("/caregiver/{caregiverId}/care-gaps")
    @PreAuthorize("hasRole('CAREGIVER') and @accessScopeAuthorizer.canAccessCaregiver(authentication, #caregiverId)")
    public List<IntelligenceDtos.MissedCareGapResponse> caregiverCareGaps(@PathVariable Long caregiverId) {
        return intelligenceService.getCaregiverCareGaps(caregiverId);
    }
}
