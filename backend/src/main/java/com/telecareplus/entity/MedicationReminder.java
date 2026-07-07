package com.telecareplus.entity;

import com.telecareplus.entity.enums.ReminderStatus;
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
public class MedicationReminder extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(optional = false)
    @JoinColumn(name = "medication_item_id", nullable = false)
    private MedicationItem medicationItem;

    @Column(nullable = false)
    private LocalDate scheduledDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReminderStatus status;
}
