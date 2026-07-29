package com.telecareplus.clinical;

import com.telecareplus.users.Doctor;
import com.telecareplus.users.Patient;

import com.telecareplus.common.BaseEntity;

import com.telecareplus.clinical.ObservationSource;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class PatientObservation extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ObservationSource source;

    @Column(nullable = false)
    private String observationType;

    @Column(nullable = false)
    private String metricName;

    @Column(nullable = false)
    private String metricValue;

    private String unit;

    @Column(nullable = false)
    private boolean abnormalFlag;

    @Column(length = 1500)
    private String notes;

    @Column(nullable = false)
    private LocalDateTime measuredAt;
}
