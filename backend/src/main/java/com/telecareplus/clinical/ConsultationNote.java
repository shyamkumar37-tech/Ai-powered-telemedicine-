package com.telecareplus.clinical;

import com.telecareplus.common.BaseEntity;

import com.telecareplus.users.Patient;
import com.telecareplus.appointments.Appointment;
import com.telecareplus.users.Doctor;

import com.telecareplus.clinical.ConsultationOutcome;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class ConsultationNote extends BaseEntity {

    @OneToOne(optional = false)
    @JoinColumn(name = "appointment_id", nullable = false, unique = true)
    private Appointment appointment;

    @ManyToOne(optional = false)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @ManyToOne(optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(length = 2000, nullable = false)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConsultationOutcome outcome;

    private LocalDate followUpDate;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private Boolean aiGenerated = false;

    private java.time.LocalDateTime reviewedAt;

    private String reviewedBy;
}
