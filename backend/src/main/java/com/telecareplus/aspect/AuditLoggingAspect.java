package com.telecareplus.aspect;

import com.telecareplus.annotation.AuditLog;
import com.telecareplus.security.CustomUserPrincipal;
import com.telecareplus.service.AccessAuditService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditLoggingAspect {

    private final AccessAuditService accessAuditService;

    @Around("@annotation(com.telecareplus.annotation.AuditLog)")
    public Object logAuditActivity(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        AuditLog auditAnnotation = method.getAnnotation(AuditLog.class);

        String action = auditAnnotation.action();
        String resourceType = auditAnnotation.resourceType();

        // Extract User
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CustomUserPrincipal principal = null;
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserPrincipal) {
            principal = (CustomUserPrincipal) authentication.getPrincipal();
        }

        // Extract Request
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        HttpServletRequest request = null;
        if (attributes != null) {
            request = attributes.getRequest();
        }

        Object result;
        try {
            result = joinPoint.proceed();
            accessAuditService.logAuditAction(principal, action, resourceType, "SUCCESS", null, maskRequest(request));
        } catch (Throwable e) {
            accessAuditService.logAuditAction(principal, action, resourceType, "DENIED", e.getMessage(), maskRequest(request));
            throw e;
        }

        return result;
    }

    private HttpServletRequest maskRequest(HttpServletRequest request) {
        if (request == null) return null;
        // In a real scenario, we would use a HttpServletRequestWrapper to override getHeader() and getParameter() 
        // to mask "Authorization", "password", etc., before passing to the audit service.
        return new jakarta.servlet.http.HttpServletRequestWrapper(request) {
            @Override
            public String getHeader(String name) {
                if ("Authorization".equalsIgnoreCase(name)) {
                    return "***MASKED***";
                }
                return super.getHeader(name);
            }

            @Override
            public String getParameter(String name) {
                if ("password".equalsIgnoreCase(name) || name.toLowerCase().contains("secret") || name.toLowerCase().contains("token")) {
                    return "***MASKED***";
                }
                return super.getParameter(name);
            }
        };
    }
}
