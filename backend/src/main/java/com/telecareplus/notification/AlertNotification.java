package com.telecareplus.notification;

import com.telecareplus.common.BaseEntity;
import com.telecareplus.users.Patient;

import com.telecareplus.common.AlertSeverity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class AlertNotification extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlertSeverity severity;

    @Column(length = 1500, nullable = false)
    private String message;

    @Column(nullable = false)
    private boolean active;
}
