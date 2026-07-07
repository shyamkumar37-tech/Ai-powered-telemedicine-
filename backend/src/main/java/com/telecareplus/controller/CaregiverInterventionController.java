package com.telecareplus.controller;

import com.telecareplus.dto.CaregiverInterventionDtos;
import com.telecareplus.service.CaregiverInterventionService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/caregiver-interventions")
@RequiredArgsConstructor
public class CaregiverInterventionController {

    private final CaregiverInterventionService caregiverInterventionService;

    @PostMapping
    @PreAuthorize("hasRole('CAREGIVER') and @accessScopeAuthorizer.canAccessCaregiver(authentication, #request.caregiverId()) and @accessScopeAuthorizer.canAccessPatientCare(authentication, #request.patientId())")
    public CaregiverInterventionDtos.CaregiverInterventionResponse create(@Valid @RequestBody CaregiverInterventionDtos.CaregiverInterventionRequest request) {
        return caregiverInterventionService.create(request);
    }

    @GetMapping("/caregiver/{caregiverId}")
    @PreAuthorize("hasRole('CAREGIVER') and @accessScopeAuthorizer.canAccessCaregiver(authentication, #caregiverId)")
    public List<CaregiverInterventionDtos.CaregiverInterventionResponse> list(@PathVariable Long caregiverId) {
        return caregiverInterventionService.listByCaregiver(caregiverId);
    }

    @PatchMapping("/{interventionId}/status")
    @PreAuthorize("hasRole('CAREGIVER') and @accessScopeAuthorizer.canAccessCaregiverIntervention(authentication, #interventionId)")
    public CaregiverInterventionDtos.CaregiverInterventionResponse updateStatus(
            @PathVariable Long interventionId,
            @Valid @RequestBody CaregiverInterventionDtos.CaregiverInterventionStatusRequest request) {
        return caregiverInterventionService.updateStatus(interventionId, request);
    }
}
