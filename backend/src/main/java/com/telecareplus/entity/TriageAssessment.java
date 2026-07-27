package com.telecareplus.entity;

import com.telecareplus.entity.enums.TriageLevel;
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
public class TriageAssessment extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(length = 2000, nullable = false)
    private String symptoms;

    private Integer symptomDurationDays;
    private Boolean chestPain;
    private Boolean severeBreathlessness;
    private Boolean fainting;
    private Double oxygenLevel;
    private Double temperature;
    private Boolean persistentHighFever;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TriageLevel level;

    @Column(length = 2000, nullable = false)
    private String recommendation;

    private LocalDateTime assessedAt;
    public java.time.LocalDateTime getAssessedAt() { return assessedAt; }
    public String getSymptoms() { return symptoms; }
    public com.telecareplus.entity.enums.TriageLevel getLevel() { return level; }
}

