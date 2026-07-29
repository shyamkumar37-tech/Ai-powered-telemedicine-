package com.telecareplus.clinical;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LabReportRepository extends JpaRepository<LabReport, Long> {
    List<LabReport> findByPatientIdOrderByReportedAtDesc(Long patientId);
}
