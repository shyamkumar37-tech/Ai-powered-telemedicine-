package com.telecareplus.clinical;

import com.telecareplus.clinical.TriageAssessment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TriageAssessmentRepository extends JpaRepository<TriageAssessment, Long> {
    List<TriageAssessment> findByPatientIdOrderByAssessedAtDesc(Long patientId);
    TriageAssessment findTopByPatientIdOrderByAssessedAtDesc(Long patientId);
    boolean existsByIdAndPatientId(Long triageAssessmentId, Long patientId);
}
