package com.telecareplus.dto;

import com.telecareplus.entity.enums.AlertSeverity;
import java.time.LocalDateTime;

public class AlertDtos {

    public record AlertResponse(
            Long id,
            Long patientId,
            String patientName,
            AlertSeverity severity,
            String message,
            boolean active,
            LocalDateTime createdAt
    ) {}
}
