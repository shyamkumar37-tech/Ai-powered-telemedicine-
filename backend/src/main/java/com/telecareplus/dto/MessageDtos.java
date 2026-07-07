package com.telecareplus.dto;

import com.telecareplus.entity.enums.RoleType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

public class MessageDtos {

    public static final int MAX_BODY_LENGTH = 2000;

    public record ContactResponse(
            Long userId,
            Long profileId,
            RoleType role,
            String displayName,
            String descriptor
    ) {}

    public record MessageRequest(
            @NotNull Long patientId,
            @NotNull Long senderUserId,
            @NotNull Long recipientUserId,
            @NotBlank String subject,
            @NotBlank @jakarta.validation.constraints.Size(max = MAX_BODY_LENGTH, message = "Message body must be at most 2000 characters") String body
    ) {}

    public record MessageResponse(
            Long id,
            Long patientId,
            String patientName,
            Long senderUserId,
            String senderName,
            RoleType senderRole,
            Long recipientUserId,
            String recipientName,
            RoleType recipientRole,
            String subject,
            String body,
            boolean acknowledged,
            LocalDateTime readAt,
            LocalDateTime createdAt
    ) {}

    public record MessageInboxResponse(
            List<ContactResponse> contacts,
            List<MessageResponse> messages
    ) {}
}
