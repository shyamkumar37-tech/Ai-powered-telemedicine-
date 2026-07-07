package com.telecareplus.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class Doctor extends BaseEntity {

    @OneToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private String specialization;

    @Column(nullable = false)
    private Integer experienceYears;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal consultationFee;

    private String qualification;

    @Column(length = 1200)
    private String availabilitySummary;

    @Column(length = 1200)
    private String bio;
}
