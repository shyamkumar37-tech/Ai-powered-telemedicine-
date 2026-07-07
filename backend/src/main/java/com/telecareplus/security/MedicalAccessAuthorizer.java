package com.telecareplus.security;

import com.telecareplus.entity.enums.RoleType;
import com.telecareplus.repository.PatientCaregiverLinkRepository;
import com.telecareplus.repository.PatientRepository;
import com.telecareplus.service.AccessAuditService;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Component("medicalAccessAuthorizer")
@RequiredArgsConstructor
public class MedicalAccessAuthorizer {

    private static final String CACHE_PREFIX = MedicalAccessAuthorizer.class.getName() + ".medicationHistory.";

    private final PatientRepository patientRepository;
    private final PatientCaregiverLinkRepository patientCaregiverLinkRepository;
    private final AccessAuditService accessAuditService;

    public boolean canViewMedicationHistory(Authentication authentication, Long patientId) {
        Decision decision = evaluate(authentication, patientId);
        return decision.allowed();
    }

    public void assertCanViewMedicationHistory(Authentication authentication, Long patientId) {
        Decision decision = evaluate(authentication, patientId);
        if (!decision.allowed()) {
            throw new AccessDeniedException("Access denied");
        }
    }

    private Decision evaluate(Authentication authentication, Long patientId) {
        String cacheKey = CACHE_PREFIX + (authentication == null ? "anonymous" : authentication.getName()) + ":" + patientId;
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            Object cached = attributes.getAttribute(cacheKey, RequestAttributes.SCOPE_REQUEST);
            if (cached instanceof Decision decision) {
                return decision;
            }
        }

        Decision decision = computeDecision(authentication, patientId);

        if (attributes != null) {
            attributes.setAttribute(cacheKey, decision, RequestAttributes.SCOPE_REQUEST);
        }

        HttpServletRequest request = attributes instanceof ServletRequestAttributes servletRequestAttributes
                ? servletRequestAttributes.getRequest()
                : null;
        accessAuditService.logMedicationHistoryAccess(decision.principal(), patientId, decision.allowed() ? "SUCCESS" : "DENIED", decision.reason(), request);
        return decision;
    }

    private Decision computeDecision(Authentication authentication, Long patientId) {
        if (patientId == null) {
            return new Decision(false, null, "patient_id_missing");
        }
        if (authentication == null || !authentication.isAuthenticated()) {
            return new Decision(false, null, "unauthenticated");
        }
        if (!(authentication.getPrincipal() instanceof CustomUserPrincipal principal)) {
            return new Decision(false, null, "invalid_principal");
        }

        if (principal.getRole() == RoleType.PATIENT) {
            boolean allowed = patientRepository.existsByIdAndUserId(patientId, principal.getUserId());
            return new Decision(allowed, principal, allowed ? null : "patient_self_access_denied");
        }

        if (principal.getRole() == RoleType.CAREGIVER) {
            boolean allowed = patientCaregiverLinkRepository.canViewMedicationHistory(patientId, principal.getUserId(), Instant.now());
            return new Decision(allowed, principal, allowed ? null : "caregiver_assignment_or_consent_denied");
        }

        return new Decision(false, principal, "unsupported_role");
    }

    private record Decision(boolean allowed, CustomUserPrincipal principal, String reason) {}
}
