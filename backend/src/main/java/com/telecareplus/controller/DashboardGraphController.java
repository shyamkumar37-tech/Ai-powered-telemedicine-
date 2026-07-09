package com.telecareplus.controller;

import com.telecareplus.dto.DashboardDtos.DashboardSummaryResponse;
import com.telecareplus.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'CAREGIVER', 'PHARMACIST', 'ADMIN')")
public class DashboardGraphController {

    private final DashboardService dashboardService;

    @QueryMapping
    public DashboardSummaryResponse patientDashboard(@Argument Long patientId) {
        return dashboardService.getPatientDashboard(patientId);
    }
}
