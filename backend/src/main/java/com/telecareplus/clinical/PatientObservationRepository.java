package com.telecareplus.clinical;

import com.telecareplus.clinical.PatientObservation;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientObservationRepository extends JpaRepository<PatientObservation, Long> {
    List<PatientObservation> findByPatientIdOrderByMeasuredAtDesc(Long patientId);
    List<PatientObservation> findByPatientIdAndAbnormalFlagTrueOrderByMeasuredAtDesc(Long patientId);
    long countByPatientId(Long patientId);
    long countByPatientIdAndAbnormalFlagTrue(Long patientId);
}
