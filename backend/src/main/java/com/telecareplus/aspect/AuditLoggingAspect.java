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
            accessAuditService.logAuditAction(principal, action, resourceType, "SUCCESS", null, request);
        } catch (Throwable e) {
            accessAuditService.logAuditAction(principal, action, resourceType, "DENIED", e.getMessage(), request);
            throw e;
        }

        return result;
    }
}
