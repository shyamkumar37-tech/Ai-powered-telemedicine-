package com.telecareplus.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class AuditLogAspect {

    private final ObjectMapper objectMapper;

    @Around("@annotation(auditable)")
    public Object logAudit(ProceedingJoinPoint joinPoint, Auditable auditable) throws Throwable {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = (authentication != null && authentication.getName() != null) ? authentication.getName() : "anonymous";

        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        String methodName = signature.getDeclaringTypeName() + "." + signature.getName();
        
        long startTime = System.currentTimeMillis();
        String status = "SUCCESS";
        String errorMessage = null;
        Object result = null;

        try {
            result = joinPoint.proceed();
            return result;
        } catch (Throwable e) {
            status = "FAILED";
            errorMessage = e.getMessage();
            throw e;
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            logAsync(auditable.action(), username, methodName, status, errorMessage, duration);
        }
    }

    @Async
    protected void logAsync(String action, String username, String method, String status, String errorMessage, long duration) {
        try {
            Map<String, Object> logEntry = new HashMap<>();
            logEntry.put("timestamp", Instant.now().toString());
            logEntry.put("action", action);
            logEntry.put("user", username);
            logEntry.put("method", method);
            logEntry.put("status", status);
            logEntry.put("durationMs", duration);
            if (errorMessage != null) {
                logEntry.put("error", errorMessage);
            }
            
            // Log formatted as JSON for Elasticsearch
            log.info("AUDIT_LOG: {}", objectMapper.writeValueAsString(logEntry));
        } catch (Exception e) {
            log.error("Failed to write audit log asynchronously", e);
        }
    }
}
