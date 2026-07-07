package com.telecareplus.controller;

import com.telecareplus.dto.DashboardDtos;
import com.telecareplus.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public DashboardDtos.DashboardSummaryResponse patient(@PathVariable Long patientId) {
        return dashboardService.getPatientDashboard(patientId);
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasRole('DOCTOR') and @accessScopeAuthorizer.canAccessDoctor(authentication, #doctorId)")
    public DashboardDtos.DashboardSummaryResponse doctor(@PathVariable Long doctorId) {
        return dashboardService.getDoctorDashboard(doctorId);
    }

    @GetMapping("/caregiver/{caregiverId}")
    @PreAuthorize("hasRole('CAREGIVER') and @accessScopeAuthorizer.canAccessCaregiver(authentication, #caregiverId)")
    public DashboardDtos.DashboardSummaryResponse caregiver(@PathVariable Long caregiverId) {
        return dashboardService.getCaregiverDashboard(caregiverId);
    }
}
