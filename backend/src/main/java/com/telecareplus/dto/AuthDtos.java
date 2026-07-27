package com.telecareplus.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.telecareplus.entity.enums.RoleType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    public record RegisterRequest(
            @NotBlank String fullName,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 6, message = "Password must be at least 6 characters") String password,
            @NotBlank String phone,
            @NotNull RoleType role
    ) {}

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password
    ) {}

    public record OtpRequest(
            @NotBlank @Size(min = 10, max = 15, message = "Enter a valid mobile number") String phone
    ) {}

    public record OtpSendResponse(
            String phone,
            String message,
            long expiresInSeconds
    ) {}

    public record OtpVerifyRequest(
            @NotBlank @Size(min = 10, max = 15, message = "Enter a valid mobile number") String phone,
            @NotBlank @Size(min = 6, max = 6, message = "OTP must be 6 digits") String otp
    ) {}

    public record UserSummary(
            Long id,
            String fullName,
            String email,
            String phone,
            RoleType role,
            String preferredLanguage
    ) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record AuthResponse(
            String token,
            Long userId,
            Long profileId,
            RoleType role,
            String fullName,
            String email,
            String phone,
            UserSummary user,
            Boolean isProfileComplete
    ) {}
}
