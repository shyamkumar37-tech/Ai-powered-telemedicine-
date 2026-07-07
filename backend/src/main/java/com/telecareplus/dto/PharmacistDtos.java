package com.telecareplus.dto;

import com.telecareplus.entity.enums.DispenseStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class PharmacistDtos {

    public record DashboardResponse(
            long pendingVerifications,
            long lowStockItems,
            long dispensedToday,
            long activeInventoryItems
    ) {}

    public record InventoryRequest(
            @NotBlank String medicineName,
            String formulation,
            @Min(0) int quantityAvailable,
            @Min(0) int reorderLevel,
            @NotBlank String unitLabel
    ) {}

    public record InventoryResponse(
            Long id,
            String medicineName,
            String formulation,
            int quantityAvailable,
            int reorderLevel,
            String unitLabel,
            boolean lowStock
    ) {}

    public record DispenseActionRequest(
            DispenseStatus status,
            String verificationNotes
    ) {}

    public record DispenseRecordResponse(
            Long id,
            Long prescriptionId,
            Long patientId,
            String patientName,
            String doctorName,
            List<String> medicines,
            LocalDate followUpDate,
            DispenseStatus status,
            String verificationNotes,
            String pickupCode,
            LocalDateTime dispensedAt,
            LocalDateTime createdAt
    ) {}
}
