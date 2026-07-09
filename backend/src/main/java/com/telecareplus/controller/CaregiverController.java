package com.telecareplus.controller;

import com.telecareplus.dto.CaregiverDtos;
import com.telecareplus.service.CaregiverService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/caregivers")
@RequiredArgsConstructor
public class CaregiverController {

    private final CaregiverService caregiverService;

    @PostMapping("/link")
    @PreAuthorize("hasRole('CAREGIVER') and @accessScopeAuthorizer.canCreateCaregiverLink(authentication, #request.patientId(), #request.caregiverId())")
    public void link(@Valid @RequestBody CaregiverDtos.CaregiverLinkRequest request) {
        caregiverService.linkPatient(request);
    }

    @GetMapping("/{caregiverId}/linked-patients")
    @PreAuthorize("hasRole('CAREGIVER') and @accessScopeAuthorizer.canAccessCaregiver(authentication, #caregiverId)")
    public List<CaregiverDtos.LinkedPatientResponse> list(@PathVariable Long caregiverId) {
        return caregiverService.getLinkedPatients(caregiverId);
    }

    @PostMapping("/invite")
    @PreAuthorize("hasAnyRole('PATIENT', 'CAREGIVER') and @accessScopeAuthorizer.canAccessPatient(authentication, #request.patientId())")
    public void invite(@Valid @RequestBody CaregiverDtos.CaregiverInviteRequest request) {
        caregiverService.inviteCaregiver(request);
    }
}
