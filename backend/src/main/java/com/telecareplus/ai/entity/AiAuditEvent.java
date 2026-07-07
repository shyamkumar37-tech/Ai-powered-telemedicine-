package com.telecareplus.ai.entity;

import com.telecareplus.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class AiAuditEvent extends BaseEntity {

    @Column(nullable = false)
    private String featureKey;

    private Long patientId;

    private Long userId;

    @Column(length = 2000)
    private String inputSummary;

    @Column(length = 4000)
    private String outputSummary;

    @Column(length = 2000)
    private String rationale;

    @Column(length = 120)
    private String riskLevel;
}
