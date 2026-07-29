package com.telecareplus.billing;

import java.math.BigDecimal;
import java.util.List;

public class BillingDtos {

    public record CreateClaimRequest(
            Long patientId,
            String policyNumber,
            String providerName,
            BigDecimal claimAmount,
            String diagnosisCode
    ) {}

    public record ClaimResponse(
            Long id,
            Long patientId,
            String policyNumber,
            String providerName,
            BigDecimal claimAmount,
            BigDecimal approvedAmount,
            String status,
            String submittedAt
    ) {}

    public record CreateInvoiceRequest(
            Long patientId,
            BigDecimal totalAmount,
            BigDecimal copayAmount
    ) {}

    public record InvoiceResponse(
            Long id,
            Long patientId,
            String invoiceNumber,
            BigDecimal totalAmount,
            BigDecimal copayAmount,
            String paymentStatus,
            String issuedAt,
            String paidAt
    ) {}
}
