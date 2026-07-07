package com.telecareplus.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "access_audit_log")
public class AccessAuditLog extends BaseEntity {

    @Column
    private Long actorUserId;

    @Column(length = 40)
    private String actorRole;

    @Column
    private Long patientId;

    @Column(nullable = false, length = 80)
    private String action;

    @Column(nullable = false, length = 80)
    private String resourceType;

    @Column(nullable = false, length = 20)
    private String outcome;

    @Column(length = 120)
    private String requestId;

    @Column(length = 64)
    private String sourceIp;

    @Column(length = 512)
    private String userAgent;

    @Column(length = 255)
    private String denialReason;
}
