package com.telecareplus.users;

import com.telecareplus.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class PatientChatMessage extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(nullable = false, length = 1500)
    private String question;

    @Column(nullable = false, length = 3000)
    private String answer;

    @Column(nullable = false)
    private String urgencyLabel;

    @Column(nullable = false, length = 2000)
    private String suggestedActions;
}
