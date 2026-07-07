package com.telecareplus.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class Patient extends BaseEntity {

    @OneToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private Integer age;

    @Column(nullable = false)
    private String gender;

    private String bloodGroup;
    private String allergies;
    private String diseases;
    private String emergencyContactName;
    private String emergencyContactPhone;

    @Column(length = 2000)
    private String medicalHistorySummary;
}
