package com.telecareplus.ai.repository;

import com.telecareplus.ai.entity.AiAuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AiAuditEventRepository extends JpaRepository<AiAuditEvent, Long> {
    
    @Query("SELECT e FROM AiAuditEvent e WHERE " +
           "(:patientId IS NULL OR e.patientId = :patientId) AND " +
           "(:userId IS NULL OR e.userId = :userId) AND " +
           "(:featureKey IS NULL OR e.featureKey = :featureKey)")
    Page<AiAuditEvent> findByFilters(
        @Param("patientId") Long patientId,
        @Param("userId") Long userId,
        @Param("featureKey") String featureKey,
        Pageable pageable
    );
}
