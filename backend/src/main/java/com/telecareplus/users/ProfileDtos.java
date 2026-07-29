package com.telecareplus.users;

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
            String dateOfBirth,
            @NotBlank String gender,
            String bloodGroup,
            String allergies,
            String diseases,
            String emergencyContactName,
            String emergencyContactPhone,
            String medicalHistorySummary,
            String height,
            String weight,
            String currentMedications,
            String insuranceInfo,
            Boolean emailNotificationsEnabled,
            Boolean smsNotificationsEnabled,
            Boolean pushNotificationsEnabled
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
            String preferredLanguage,
            Boolean emailNotificationsEnabled,
            Boolean smsNotificationsEnabled,
            Boolean pushNotificationsEnabled
    ) {}

    public record PatientProfileResponse(
            Long patientId,
            UserSummary user,
            String dateOfBirth,
            String gender,
            String bloodGroup,
            String allergies,
            String diseases,
            String emergencyContactName,
            String emergencyContactPhone,
            String medicalHistorySummary,
            String height,
            String weight,
            String currentMedications,
            String insuranceInfo,
            boolean isProfileComplete
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
