package com.telecareplus.repository;

import com.telecareplus.entity.CaregiverIntervention;
import com.telecareplus.entity.enums.CaregiverInterventionStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CaregiverInterventionRepository extends JpaRepository<CaregiverIntervention, Long> {
    List<CaregiverIntervention> findByCaregiverIdOrderByActionAtDesc(Long caregiverId);
    long countByCaregiverIdAndStatus(Long caregiverId, CaregiverInterventionStatus status);

    @Query("""
        select case when count(intervention) > 0 then true else false end
        from CaregiverIntervention intervention
        where intervention.id = :interventionId
          and intervention.caregiver.user.id = :userId
    """)
    boolean existsByIdAndCaregiverUserId(@Param("interventionId") Long interventionId, @Param("userId") Long userId);
}
