package com.telecareplus.billing;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InsuranceClaimRepository extends JpaRepository<InsuranceClaim, Long> {
    List<InsuranceClaim> findByPatientIdOrderBySubmittedAtDesc(Long patientId);
}
