package com.telecareplus.clinical;

import com.telecareplus.clinical.ReferralRecommendation;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReferralRecommendationRepository extends JpaRepository<ReferralRecommendation, Long> {
    List<ReferralRecommendation> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);
    List<ReferralRecommendation> findByPatientIdOrderByCreatedAtDesc(Long patientId);
}
