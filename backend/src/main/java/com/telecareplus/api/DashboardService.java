package com.telecareplus.api;

import com.telecareplus.api.DashboardDtos;

public interface DashboardService {
    DashboardDtos.DashboardSummaryResponse getPatientDashboard(Long patientId);
    DashboardDtos.DashboardSummaryResponse getDoctorDashboard(Long doctorId);
    DashboardDtos.DashboardSummaryResponse getCaregiverDashboard(Long caregiverId);
}
