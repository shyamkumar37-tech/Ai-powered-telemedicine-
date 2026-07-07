package com.telecareplus.service;

import com.telecareplus.entity.AccessAuditLog;
import com.telecareplus.security.CustomUserPrincipal;
import com.telecareplus.repository.AccessAuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AccessAuditService {

    private final AccessAuditLogRepository accessAuditLogRepository;

    @Transactional
    public void logMedicationHistoryAccess(
            CustomUserPrincipal principal,
            Long patientId,
            String outcome,
            String denialReason,
            HttpServletRequest request
    ) {
        AccessAuditLog entry = new AccessAuditLog();
        entry.setActorUserId(principal == null ? null : principal.getUserId());
        entry.setActorRole(principal == null || principal.getRole() == null ? null : principal.getRole().name());
        entry.setPatientId(patientId);
        entry.setAction("VIEW_MEDICATION_HISTORY");
        entry.setResourceType("PRESCRIPTION_HISTORY");
        entry.setOutcome(outcome);
        entry.setDenialReason(denialReason);
        entry.setRequestId(request == null ? null : request.getHeader("X-Request-Id"));
        entry.setSourceIp(request == null ? null : request.getRemoteAddr());
        entry.setUserAgent(request == null ? null : request.getHeader("User-Agent"));
        accessAuditLogRepository.save(entry);
    }
}
