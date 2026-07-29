package com.telecareplus.api;

import com.telecareplus.api.DashboardDtos;
import com.telecareplus.api.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.cache.annotation.Cacheable;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    @Cacheable(value = "dashboardPatient", key = "#patientId", unless = "#result == null")
    public DashboardDtos.DashboardSummaryResponse patient(@PathVariable Long patientId) {
        return dashboardService.getPatientDashboard(patientId);
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasRole('DOCTOR') and @accessScopeAuthorizer.canAccessDoctor(authentication, #doctorId)")
    @Cacheable(value = "dashboardDoctor", key = "#doctorId", unless = "#result == null")
    public DashboardDtos.DashboardSummaryResponse doctor(@PathVariable Long doctorId) {
        return dashboardService.getDoctorDashboard(doctorId);
    }

    @GetMapping("/caregiver/{caregiverId}")
    @PreAuthorize("hasRole('CAREGIVER') and @accessScopeAuthorizer.canAccessCaregiver(authentication, #caregiverId)")
    @Cacheable(value = "dashboardCaregiver", key = "#caregiverId", unless = "#result == null")
    public DashboardDtos.DashboardSummaryResponse caregiver(@PathVariable Long caregiverId) {
        return dashboardService.getCaregiverDashboard(caregiverId);
    }
}
