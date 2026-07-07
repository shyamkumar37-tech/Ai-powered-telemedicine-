package com.telecareplus.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class ProfileDtos {

    public record PatientProfileRequest(
            @NotBlank String fullName,
            @NotBlank @Email String email,
            @NotBlank String phone,
            String preferredLanguage,
            @NotNull Integer age,
            @NotBlank String gender,
            String bloodGroup,
            String allergies,
            String diseases,
            String emergencyContactName,
            String emergencyContactPhone,
            String medicalHistorySummary
    ) {}

    public record DoctorProfileRequest(
            @NotBlank String fullName,
            @NotBlank @Email String email,
            @NotBlank String phone,
            String preferredLanguage,
            @NotBlank String specialization,
            @NotNull Integer experienceYears,
            @NotNull BigDecimal consultationFee,
            String qualification,
            String availabilitySummary,
            String bio
    ) {}

    public record CaregiverProfileRequest(
            @NotBlank String fullName,
            @NotBlank @Email String email,
            @NotBlank String phone,
            String preferredLanguage,
            String relationshipLabel
    ) {}

    public record UserSummary(
            Long id,
            String fullName,
            String email,
            String phone,
            String preferredLanguage
    ) {}

    public record PatientProfileResponse(
            Long patientId,
            UserSummary user,
            Integer age,
            String gender,
            String bloodGroup,
            String allergies,
            String diseases,
            String emergencyContactName,
            String emergencyContactPhone,
            String medicalHistorySummary
    ) {}

    public record DoctorProfileResponse(
            Long doctorId,
            UserSummary user,
            String specialization,
            Integer experienceYears,
            BigDecimal consultationFee,
            String qualification,
            String availabilitySummary,
            String bio
    ) {}

    public record CaregiverProfileResponse(
            Long caregiverId,
            UserSummary user,
            String relationshipLabel
    ) {}
}
