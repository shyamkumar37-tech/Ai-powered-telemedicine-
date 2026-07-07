package com.telecareplus.repository;

import com.telecareplus.entity.ReferralRecommendation;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReferralRecommendationRepository extends JpaRepository<ReferralRecommendation, Long> {
    List<ReferralRecommendation> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);
    List<ReferralRecommendation> findByPatientIdOrderByCreatedAtDesc(Long patientId);
}
