package com.telecareplus.repository;

import com.telecareplus.entity.PriorAuthorization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PriorAuthorizationRepository extends JpaRepository<PriorAuthorization, Long> {
    List<PriorAuthorization> findByPatientId(Long patientId);
}
