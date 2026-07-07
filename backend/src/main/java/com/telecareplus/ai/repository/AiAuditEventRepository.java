package com.telecareplus.ai.repository;

import com.telecareplus.ai.entity.AiAuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiAuditEventRepository extends JpaRepository<AiAuditEvent, Long> {
}
