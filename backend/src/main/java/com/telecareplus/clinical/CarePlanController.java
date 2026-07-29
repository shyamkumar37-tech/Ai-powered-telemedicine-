package com.telecareplus.clinical;

import com.telecareplus.clinical.CarePlanDtos;
import com.telecareplus.clinical.CarePlanService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/care-plans")
@RequiredArgsConstructor
public class CarePlanController {

    private final CarePlanService carePlanService;

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR') and @accessScopeAuthorizer.canAccessDoctorPatient(authentication, #request.doctorId(), #request.patientId())")
    public CarePlanDtos.CarePlanResponse create(@Valid @RequestBody CarePlanDtos.CarePlanRequest request) {
        return carePlanService.createPlan(request);
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public List<CarePlanDtos.CarePlanResponse> patientPlans(@PathVariable Long patientId) {
        return carePlanService.getPatientPlans(patientId);
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasRole('DOCTOR') and @accessScopeAuthorizer.canAccessDoctor(authentication, #doctorId)")
    public List<CarePlanDtos.CarePlanResponse> doctorPlans(@PathVariable Long doctorId) {
        return carePlanService.getDoctorPlans(doctorId);
    }
}
