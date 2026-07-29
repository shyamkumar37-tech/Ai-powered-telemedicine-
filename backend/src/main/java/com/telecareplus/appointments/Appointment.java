package com.telecareplus.appointments;

import com.telecareplus.users.Doctor;
import com.telecareplus.users.Patient;

import com.telecareplus.common.BaseEntity;

import com.telecareplus.appointments.AppointmentStatus;
import com.telecareplus.common.ConsultationMode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(
        name = "appointment",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_appointment_doctor_datetime", columnNames = { "doctor_id", "appointment_date_time" })
        },
        indexes = {
                @Index(name = "idx_appointment_doctor_datetime", columnList = "doctor_id, appointment_date_time"),
                @Index(name = "idx_appointment_patient_datetime", columnList = "patient_id, appointment_date_time")
        }
)
public class Appointment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @Column(name = "triage_assessment_id")
    private Long triageAssessmentId;

    @Column(nullable = false)
    private LocalDateTime appointmentDateTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConsultationMode mode;

    @Column(length = 1200)
    private String concernSummary;
}
