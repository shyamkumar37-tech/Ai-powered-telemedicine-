package com.telecareplus.billing;

import com.telecareplus.common.BaseEntity;
import com.telecareplus.users.Patient;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "insurance_claim")
public class InsuranceClaim extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(nullable = false)
    private String policyNumber;

    @Column(nullable = false)
    private String providerName;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal claimAmount;

    @Column(precision = 10, scale = 2)
    private BigDecimal approvedAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClaimStatus status = ClaimStatus.SUBMITTED;

    private String diagnosisCode;
    private LocalDateTime submittedAt = LocalDateTime.now();

    public enum ClaimStatus {
        SUBMITTED,
        UNDER_REVIEW,
        APPROVED,
        REJECTED,
        PAID
    }
}
