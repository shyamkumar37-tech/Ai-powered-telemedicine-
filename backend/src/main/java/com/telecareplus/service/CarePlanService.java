package com.telecareplus.service;

import com.telecareplus.dto.CarePlanDtos;
import java.util.List;

public interface CarePlanService {
    CarePlanDtos.CarePlanResponse createPlan(CarePlanDtos.CarePlanRequest request);
    List<CarePlanDtos.CarePlanResponse> getPatientPlans(Long patientId);
    List<CarePlanDtos.CarePlanResponse> getDoctorPlans(Long doctorId);
}
