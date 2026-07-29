package com.telecareplus.billing;

import com.telecareplus.users.Patient;

import com.telecareplus.users.PatientRepository;
import com.telecareplus.common.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Tag(name = "Billing & Insurance", description = "Endpoints for Billing, Payment Invoices, and Insurance Claims")
@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {

    private final InsuranceClaimRepository claimRepository;
    private final InvoiceRepository invoiceRepository;
    private final PatientRepository patientRepository;

    @Operation(summary = "Submit Insurance Claim")
    @PostMapping("/claims")
    public ResponseEntity<BillingDtos.ClaimResponse> submitClaim(@RequestBody BillingDtos.CreateClaimRequest request) {
        var patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        InsuranceClaim claim = new InsuranceClaim();
        claim.setPatient(patient);
        claim.setPolicyNumber(request.policyNumber());
        claim.setProviderName(request.providerName());
        claim.setClaimAmount(request.claimAmount());
        claim.setDiagnosisCode(request.diagnosisCode());
        claim.setStatus(InsuranceClaim.ClaimStatus.SUBMITTED);
        claim = claimRepository.save(claim);

        return ResponseEntity.ok(toClaimResponse(claim));
    }

    @Operation(summary = "List Insurance Claims for Patient")
    @GetMapping("/claims")
    public ResponseEntity<List<BillingDtos.ClaimResponse>> getClaims(@RequestParam Long patientId) {
        List<InsuranceClaim> claims = claimRepository.findByPatientIdOrderBySubmittedAtDesc(patientId);
        return ResponseEntity.ok(claims.stream().map(this::toClaimResponse).toList());
    }

    @Operation(summary = "Generate Invoice")
    @PostMapping("/invoices")
    public ResponseEntity<BillingDtos.InvoiceResponse> createInvoice(@RequestBody BillingDtos.CreateInvoiceRequest request) {
        var patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        Invoice invoice = new Invoice();
        invoice.setPatient(patient);
        invoice.setInvoiceNumber("INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        invoice.setTotalAmount(request.totalAmount());
        invoice.setCopayAmount(request.copayAmount());
        invoice.setPaymentStatus(Invoice.PaymentStatus.UNPAID);
        invoice = invoiceRepository.save(invoice);

        return ResponseEntity.ok(toInvoiceResponse(invoice));
    }

    @Operation(summary = "List Invoices for Patient")
    @GetMapping("/invoices")
    public ResponseEntity<List<BillingDtos.InvoiceResponse>> getInvoices(@RequestParam Long patientId) {
        List<Invoice> invoices = invoiceRepository.findByPatientIdOrderByIssuedAtDesc(patientId);
        return ResponseEntity.ok(invoices.stream().map(this::toInvoiceResponse).toList());
    }

    private BillingDtos.ClaimResponse toClaimResponse(InsuranceClaim claim) {
        return new BillingDtos.ClaimResponse(
                claim.getId(),
                claim.getPatient().getId(),
                claim.getPolicyNumber(),
                claim.getProviderName(),
                claim.getClaimAmount(),
                claim.getApprovedAmount(),
                claim.getStatus().name(),
                claim.getSubmittedAt() != null ? claim.getSubmittedAt().toString() : null
        );
    }

    private BillingDtos.InvoiceResponse toInvoiceResponse(Invoice invoice) {
        return new BillingDtos.InvoiceResponse(
                invoice.getId(),
                invoice.getPatient().getId(),
                invoice.getInvoiceNumber(),
                invoice.getTotalAmount(),
                invoice.getCopayAmount(),
                invoice.getPaymentStatus().name(),
                invoice.getIssuedAt() != null ? invoice.getIssuedAt().toString() : null,
                invoice.getPaidAt() != null ? invoice.getPaidAt().toString() : null
        );
    }
}
