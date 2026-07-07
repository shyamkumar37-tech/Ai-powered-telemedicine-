package com.telecareplus.entity;

import com.telecareplus.entity.enums.ConsultationMode;
import com.telecareplus.entity.enums.IvrServiceType;
import com.telecareplus.entity.enums.IvrSessionStatus;
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
public class IvrBookingSession extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(nullable = false)
    private String phoneNumber;

    @Column(nullable = false)
    private String languageCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IvrServiceType serviceType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IvrSessionStatus status;

    @Enumerated(EnumType.STRING)
    private ConsultationMode selectedMode;

    private LocalDateTime requestedDateTime;

    @Column(length = 1500)
    private String concernSummary;

    @Column(length = 3000)
    private String transcriptSummary;

    @ManyToOne
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;
}
