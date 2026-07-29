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
@Table(name = "invoice")
public class Invoice extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(nullable = false, unique = true)
    private String invoiceNumber;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal copayAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    private String paymentTransactionId;
    private LocalDateTime issuedAt = LocalDateTime.now();
    private LocalDateTime paidAt;

    public enum PaymentStatus {
        UNPAID,
        PARTIALLY_PAID,
        PAID,
        REFUNDED,
        CANCELLED
    }
}
