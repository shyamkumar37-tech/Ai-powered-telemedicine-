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
@Table(name = "vaccination_record")
public class VaccinationRecord extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(nullable = false)
    private String vaccineName;

    private String batchNumber;
    private String cvxCode;
    private LocalDate administeredDate = LocalDate.now();
    private LocalDate boosterDueDate;
    private String administratorName;
}
