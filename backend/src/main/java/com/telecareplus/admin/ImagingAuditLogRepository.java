package com.telecareplus.admin;

import com.telecareplus.admin.ImagingAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImagingAuditLogRepository extends JpaRepository<ImagingAuditLog, Long> {
    List<ImagingAuditLog> findByImageIdOrderByTimestampDesc(Long imageId);
}
