package com.telecareplus.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class PushDtos {

    public record PublicKeyResponse(
            boolean enabled,
            String publicKey,
            String subject
    ) {}

    public record SubscriptionKeys(
            @NotBlank String p256dh,
            @NotBlank String auth
    ) {}

    public record SubscriptionRequest(
            @NotBlank String endpoint,
            Long expirationTime,
            @NotNull @Valid SubscriptionKeys keys,
            String userAgent
    ) {}

    public record UnsubscribeRequest(
            @NotBlank String endpoint
    ) {}

    public record SubscriptionResponse(
            Long id,
            String endpoint,
            boolean active,
            LocalDateTime updatedAt
    ) {}
}
