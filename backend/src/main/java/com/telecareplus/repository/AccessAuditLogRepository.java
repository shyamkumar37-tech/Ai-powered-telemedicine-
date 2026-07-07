package com.telecareplus.repository;

import com.telecareplus.entity.AccessAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccessAuditLogRepository extends JpaRepository<AccessAuditLog, Long> {
}
