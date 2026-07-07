package com.telecareplus.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class PatientCaregiverLink extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(optional = false)
    @JoinColumn(name = "caregiver_id", nullable = false)
    private Caregiver caregiver;

    @Column(name = "caregiver_user_id")
    private Long caregiverUserId;

    private boolean active;

    @Column(nullable = false)
    private boolean medicationHistoryReadAllowed;

    private Instant validFrom;

    private Instant validTo;

    private Instant revokedAt;

    @PrePersist
    @PreUpdate
    void syncCaregiverUserId() {
        if (caregiver != null && caregiver.getUser() != null) {
            caregiverUserId = caregiver.getUser().getId();
        }
    }
}
