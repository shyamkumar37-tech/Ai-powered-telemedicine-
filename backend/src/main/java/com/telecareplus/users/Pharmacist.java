package com.telecareplus.users;

import com.telecareplus.common.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class Pharmacist extends BaseEntity {

    @OneToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private String facilityName;

    @Column(nullable = false)
    private String licenseNumber;

    @Column(length = 1200)
    private String shiftSummary;
}
