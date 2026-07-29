package com.telecareplus.users;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ConsentRecordRepository extends JpaRepository<ConsentRecord, Long> {
    List<ConsentRecord> findByPatientIdOrderByGrantedAtDesc(Long patientId);
}
