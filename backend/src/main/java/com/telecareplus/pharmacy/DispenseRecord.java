package com.telecareplus.pharmacy;

import com.telecareplus.common.BaseEntity;
import com.telecareplus.users.Patient;
import com.telecareplus.users.Pharmacist;

import com.telecareplus.pharmacy.DispenseStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class DispenseRecord extends BaseEntity {

    @OneToOne(optional = false)
    @JoinColumn(name = "prescription_id", nullable = false, unique = true)
    private Prescription prescription;

    @ManyToOne(optional = false)
    @JoinColumn(name = "pharmacist_id", nullable = false)
    private Pharmacist pharmacist;

    @ManyToOne(optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DispenseStatus status;

    @Column(length = 1500)
    private String verificationNotes;

    @Column(nullable = false)
    private String pickupCode;

    private LocalDateTime dispensedAt;
}
