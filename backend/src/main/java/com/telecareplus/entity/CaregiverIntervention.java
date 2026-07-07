package com.telecareplus.entity;

import com.telecareplus.entity.enums.CaregiverActionType;
import com.telecareplus.entity.enums.CaregiverInterventionStatus;
import com.telecareplus.entity.enums.WellbeingStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class CaregiverIntervention extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "caregiver_id", nullable = false)
    private Caregiver caregiver;

    @ManyToOne(optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "alert_notification_id")
    private AlertNotification alertNotification;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CaregiverActionType actionType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CaregiverInterventionStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WellbeingStatus wellbeingStatus;

    @Column(length = 1500)
    private String notes;

    @Column(nullable = false)
    private boolean followUpNeeded;

    @Column(nullable = false)
    private LocalDateTime actionAt;
}
