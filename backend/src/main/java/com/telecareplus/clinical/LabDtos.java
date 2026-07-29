package com.telecareplus.clinical;

import java.util.List;

public class LabDtos {

    public record CreateLabReportRequest(
            Long patientId,
            String testName,
            String loincCode,
            String resultValue,
            String referenceRange,
            String attachmentUrl
    ) {}

    public record LabReportResponse(
            Long id,
            Long patientId,
            String testName,
            String loincCode,
            String resultValue,
            String referenceRange,
            String status,
            String attachmentUrl,
            String reportedAt
    ) {}

    public record CreateVaccinationRequest(
            Long patientId,
            String vaccineName,
            String batchNumber,
            String cvxCode,
            String boosterDueDate,
            String administratorName
    ) {}

    public record VaccinationResponse(
            Long id,
            Long patientId,
            String vaccineName,
            String batchNumber,
            String cvxCode,
            String administeredDate,
            String boosterDueDate,
            String administratorName
    ) {}
}
