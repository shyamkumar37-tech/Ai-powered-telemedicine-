package com.telecareplus.entity;

import com.telecareplus.entity.enums.AlertSeverity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class HealthRecord extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    private String bloodPressure;
    private Double sugar;
    private Double weight;
    private Double spo2;
    private Double pulse;
    private Double temperature;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlertSeverity alertSeverity;

    @Column(length = 1200)
    private String alertMessage;

    private LocalDateTime recordedAt;
}
