package com.telecareplus.pharmacy;

import com.telecareplus.common.BaseEntity;
import com.telecareplus.users.Patient;

import com.telecareplus.users.Doctor;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;

@Getter
@Setter
@Entity
public class Prescription extends BaseEntity {

    @Column(name = "consultation_note_id", nullable = false, unique = true)
    private Long consultationNoteId;

    @ManyToOne(optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(optional = false)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @Column(length = 1200)
    private String notes;

    private LocalDate followUpDate;

    @OneToMany(mappedBy = "prescription")
    @BatchSize(size = 100)
    private List<MedicationItem> medicationItems = new ArrayList<>();
}
