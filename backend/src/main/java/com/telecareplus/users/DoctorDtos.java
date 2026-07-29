package com.telecareplus.users;

import java.math.BigDecimal;

public class DoctorDtos {

    public record DoctorSummaryResponse(
            Long id,
            String fullName,
            String specialization,
            Integer experienceYears,
            BigDecimal consultationFee,
            String availabilitySummary
    ) {}

    public record DoctorDetailsResponse(
            Long id,
            String fullName,
            String email,
            String phone,
            String specialization,
            Integer experienceYears,
            BigDecimal consultationFee,
            String qualification,
            String availabilitySummary,
            String bio
    ) {}
}
