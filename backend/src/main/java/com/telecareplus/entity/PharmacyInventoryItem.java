package com.telecareplus.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class PharmacyInventoryItem extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "pharmacist_id", nullable = false)
    private Pharmacist pharmacist;

    @Column(nullable = false)
    private String medicineName;

    private String formulation;

    @Column(nullable = false)
    private int quantityAvailable;

    @Column(nullable = false)
    private int reorderLevel;

    @Column(nullable = false)
    private String unitLabel;

    @Column
    private java.time.LocalDate expiryDate;

    @Column
    private String batchNumber;
}
