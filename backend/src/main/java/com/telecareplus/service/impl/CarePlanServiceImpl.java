package com.telecareplus.service.impl;

import com.telecareplus.dto.CarePlanDtos;
import com.telecareplus.entity.CarePlan;
import com.telecareplus.exception.ResourceNotFoundException;
import com.telecareplus.repository.CarePlanRepository;
import com.telecareplus.repository.DoctorRepository;
import com.telecareplus.repository.PatientRepository;
import com.telecareplus.service.CarePlanService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CarePlanServiceImpl implements CarePlanService {

    private final CarePlanRepository carePlanRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    @Override
    public CarePlanDtos.CarePlanResponse createPlan(CarePlanDtos.CarePlanRequest request) {
        var patient = patientRepository.findById(request.patientId()).orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        var doctor = doctorRepository.findById(request.doctorId()).orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        CarePlan plan = new CarePlan();
        plan.setPatient(patient);
        plan.setDoctor(doctor);
        plan.setTitle(request.title());
        plan.setConditionName(request.conditionName());
        plan.setGoals(request.goals());
        plan.setMedicationGuidance(request.medicationGuidance());
        plan.setLifestyleGuidance(request.lifestyleGuidance());
        plan.setWarningThresholds(request.warningThresholds());
        plan.setReviewFrequency(request.reviewFrequency());
        plan.setActive(request.active() == null || request.active());

        return toResponse(carePlanRepository.save(plan));
    }

    @Override
    public List<CarePlanDtos.CarePlanResponse> getPatientPlans(Long patientId) {
        return carePlanRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream().map(this::toResponse).toList();
    }

    @Override
    public List<CarePlanDtos.CarePlanResponse> getDoctorPlans(Long doctorId) {
        return carePlanRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId).stream().map(this::toResponse).toList();
    }

    private CarePlanDtos.CarePlanResponse toResponse(CarePlan plan) {
        return new CarePlanDtos.CarePlanResponse(
                plan.getId(),
                plan.getPatient().getId(),
                plan.getPatient().getUser().getFullName(),
                plan.getDoctor().getId(),
                plan.getDoctor().getUser().getFullName(),
                plan.getTitle(),
                plan.getConditionName(),
                plan.getGoals(),
                plan.getMedicationGuidance(),
                plan.getLifestyleGuidance(),
                plan.getWarningThresholds(),
                plan.getReviewFrequency(),
                plan.isActive(),
                plan.getCreatedAt()
        );
    }
}
