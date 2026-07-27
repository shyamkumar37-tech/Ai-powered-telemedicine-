package com.telecareplus.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;


import com.telecareplus.ai.entity.AiAuditEvent;
import com.telecareplus.ai.repository.AiAuditEventRepository;
import com.telecareplus.entity.AccessAuditLog;
import com.telecareplus.repository.AccessAuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "AdminAudit", description = "Endpoints for AdminAudit management")
@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuditController {

    private final AccessAuditLogRepository accessAuditLogRepository;
    private final AiAuditEventRepository aiAuditEventRepository;

    @Operation(summary = "Get Access Logs", description = "Get access logs")
    @ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/access")
    public Page<AccessAuditLog> getAccessLogs(
            @RequestParam(required = false) Long actorUserId,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) String action,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return accessAuditLogRepository.findByFilters(
                actorUserId,
                patientId,
                action,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
    }

    @Operation(summary = "Get AI Logs", description = "Get ai logs")
    @ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/ai")
    public Page<AiAuditEvent> getAiLogs(
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String featureKey,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return aiAuditEventRepository.findByFilters(
                patientId,
                userId,
                featureKey,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
    }
}
