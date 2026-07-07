package com.telecareplus.repository;

import com.telecareplus.entity.CarePlan;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CarePlanRepository extends JpaRepository<CarePlan, Long> {
    List<CarePlan> findByPatientIdOrderByCreatedAtDesc(Long patientId);
    List<CarePlan> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);
    long countByPatientIdAndActiveTrue(Long patientId);
}
