package com.telecareplus.clinical;

import com.telecareplus.clinical.CarePlanDtos;
import java.util.List;

public interface CarePlanService {
    CarePlanDtos.CarePlanResponse createPlan(CarePlanDtos.CarePlanRequest request);
    List<CarePlanDtos.CarePlanResponse> getPatientPlans(Long patientId);
    List<CarePlanDtos.CarePlanResponse> getDoctorPlans(Long doctorId);
}
