package com.telecareplus.repository;

import com.telecareplus.entity.AccessAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AccessAuditLogRepository extends JpaRepository<AccessAuditLog, Long> {

    @Query("SELECT a FROM AccessAuditLog a WHERE " +
           "(:actorUserId IS NULL OR a.actorUserId = :actorUserId) AND " +
           "(:patientId IS NULL OR a.patientId = :patientId) AND " +
           "(:action IS NULL OR a.action = :action)")
    Page<AccessAuditLog> findByFilters(
        @Param("actorUserId") Long actorUserId,
        @Param("patientId") Long patientId,
        @Param("action") String action,
        Pageable pageable
    );
}
