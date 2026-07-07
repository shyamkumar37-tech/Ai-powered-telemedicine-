package com.telecareplus.dto;

import com.telecareplus.entity.enums.AlertSeverity;
import java.util.List;

public class MedicalRecordDtos {

    public record AlertResponse(
            Long id,
            AlertSeverity severity,
            String message,
            boolean active
    ) {}

    public record PatientMedicalRecordResponse(
            Object patientProfile,
            List<?> triageHistory,
            List<?> appointments,
            List<?> consultations,
            List<?> prescriptions,
            List<?> healthRecords,
            List<?> alerts
    ) {}
}
