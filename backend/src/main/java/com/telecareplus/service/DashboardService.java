package com.telecareplus.service;

import com.telecareplus.dto.DashboardDtos;

public interface DashboardService {
    DashboardDtos.DashboardSummaryResponse getPatientDashboard(Long patientId);
    DashboardDtos.DashboardSummaryResponse getDoctorDashboard(Long doctorId);
    DashboardDtos.DashboardSummaryResponse getCaregiverDashboard(Long caregiverId);
}
