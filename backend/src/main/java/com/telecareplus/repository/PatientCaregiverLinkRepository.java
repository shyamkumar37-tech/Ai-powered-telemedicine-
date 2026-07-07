package com.telecareplus.repository;

import com.telecareplus.entity.PatientCaregiverLink;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PatientCaregiverLinkRepository extends JpaRepository<PatientCaregiverLink, Long> {
    List<PatientCaregiverLink> findByCaregiverIdAndActiveTrue(Long caregiverId);
    List<PatientCaregiverLink> findByPatientIdAndActiveTrue(Long patientId);
    boolean existsByPatientIdAndCaregiverIdAndActiveTrue(Long patientId, Long caregiverId);

    @Query("""
        select case when count(link) > 0 then true else false end
        from PatientCaregiverLink link
        where link.patient.id = :patientId
          and link.caregiverUserId = :userId
          and link.active = true
          and link.revokedAt is null
          and (link.validFrom is null or link.validFrom <= :now)
          and (link.validTo is null or link.validTo >= :now)
    """)
    boolean hasActivePatientAccess(
            @Param("patientId") Long patientId,
            @Param("userId") Long userId,
            @Param("now") Instant now
    );

    @Query("""
        select case when count(link) > 0 then true else false end
        from PatientCaregiverLink link
        where link.patient.id = :patientId
          and link.caregiverUserId = :userId
          and link.active = true
          and link.medicationHistoryReadAllowed = true
          and link.revokedAt is null
          and (link.validFrom is null or link.validFrom <= :now)
          and (link.validTo is null or link.validTo >= :now)
    """)
    boolean canViewMedicationHistory(
            @Param("patientId") Long patientId,
            @Param("userId") Long userId,
            @Param("now") Instant now
    );
}
