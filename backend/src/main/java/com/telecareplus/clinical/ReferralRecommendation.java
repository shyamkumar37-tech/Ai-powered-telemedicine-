package com.telecareplus.clinical;

import com.telecareplus.common.BaseEntity;

import com.telecareplus.users.Patient;
import com.telecareplus.appointments.Appointment;
import com.telecareplus.users.Doctor;

import com.telecareplus.clinical.ReferralStatus;
import com.telecareplus.clinical.ReferralUrgency;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class ReferralRecommendation extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(optional = false)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @ManyToOne
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @Column(nullable = false)
    private String specialty;

    private String targetFacility;

    @Column(nullable = false, length = 2000)
    private String reason;

    @Column(length = 2000)
    private String recommendationNote;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReferralUrgency urgency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReferralStatus status;

    private LocalDate recommendedDate;
}
