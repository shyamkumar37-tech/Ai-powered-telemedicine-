package com.telecareplus.clinical;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LifestyleRecordRepository extends JpaRepository<LifestyleRecord, Long> {
    List<LifestyleRecord> findByPatientIdOrderByLogDateDesc(Long patientId);
}
