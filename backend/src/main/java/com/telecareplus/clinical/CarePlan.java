package com.telecareplus.clinical;

import com.telecareplus.common.BaseEntity;

import com.telecareplus.users.Patient;
import com.telecareplus.users.Doctor;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class CarePlan extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(optional = false)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String conditionName;

    @Column(length = 2000, nullable = false)
    private String goals;

    @Column(length = 2000)
    private String medicationGuidance;

    @Column(length = 2000)
    private String lifestyleGuidance;

    @Column(length = 2000)
    private String warningThresholds;

    private String reviewFrequency;

    @Column(nullable = false)
    private boolean active;
}
