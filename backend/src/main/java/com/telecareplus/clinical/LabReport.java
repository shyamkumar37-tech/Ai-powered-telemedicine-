package com.telecareplus.clinical;

import com.telecareplus.common.BaseEntity;
import com.telecareplus.users.Patient;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "lab_report")
public class LabReport extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(nullable = false)
    private String testName;

    private String loincCode;
    private String resultValue;
    private String referenceRange;
    private String status = "FINAL";
    private String attachmentUrl;
    private LocalDateTime orderedAt = LocalDateTime.now();
    private LocalDateTime reportedAt = LocalDateTime.now();
}
