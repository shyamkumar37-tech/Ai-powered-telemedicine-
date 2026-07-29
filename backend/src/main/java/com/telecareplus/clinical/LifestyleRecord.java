package com.telecareplus.clinical;

import com.telecareplus.common.BaseEntity;
import com.telecareplus.users.Patient;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "lifestyle_record")
public class LifestyleRecord extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    private LocalDate logDate = LocalDate.now();
    private Integer caloriesConsumed;
    private Double sleepHours;
    private Integer exerciseMinutes;
    private Integer stepsCount;
    private String nutritionSummary;
}
