package com.telecareplus.admin;

import com.telecareplus.users.User;

import com.telecareplus.admin.AccessAuditLog;
import com.telecareplus.users.CustomUserPrincipal;
import com.telecareplus.admin.AccessAuditLogRepository;
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

    @Transactional
    public void logAuditAction(
            CustomUserPrincipal principal,
            String action,
            String resourceType,
            String outcome,
            String denialReason,
            HttpServletRequest request
    ) {
        AccessAuditLog entry = new AccessAuditLog();
        entry.setActorUserId(principal == null ? null : principal.getUserId());
        entry.setActorRole(principal == null || principal.getRole() == null ? null : principal.getRole().name());
        // Since we don't have a specific patient ID in all generic requests, we can leave it null or extract it if needed.
        // If we want it, we'd need to pull it from path variables, but that's complex. Null is okay for generic actions.
        entry.setAction(action);
        entry.setResourceType(resourceType);
        entry.setOutcome(outcome);
        entry.setDenialReason(denialReason);
        entry.setRequestId(request == null ? null : request.getHeader("X-Request-Id"));
        entry.setSourceIp(request == null ? null : request.getRemoteAddr());
        entry.setUserAgent(request == null ? null : request.getHeader("User-Agent"));
        accessAuditLogRepository.save(entry);
    }

    @Transactional
    public void logAccess(Long actorUserId, String actorRole, Long patientId, String action, String resourceType, String outcome, String requestId, String sourceIp, String userAgent) {
        AccessAuditLog entry = new AccessAuditLog();
        entry.setActorUserId(actorUserId);
        entry.setActorRole(actorRole);
        entry.setPatientId(patientId);
        entry.setAction(action);
        entry.setResourceType(resourceType);
        entry.setOutcome(outcome);
        entry.setRequestId(requestId);
        entry.setSourceIp(sourceIp);
        entry.setUserAgent(userAgent);
        accessAuditLogRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public java.util.List<AccessAuditLog> getPatientAccessLogs(Long patientId) {
        return accessAuditLogRepository.findByFilters(null, patientId, null, org.springframework.data.domain.PageRequest.of(0, 50, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"))).getContent();
    }
}
