package com.telecareplus.users;

import com.telecareplus.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "consent_record")
public class ConsentRecord extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(nullable = false)
    private String consentType; // e.g. "TELEHEALTH_TREATMENT", "PHI_SHARING", "RESEARCH_DATA_USE"

    @Column(nullable = false)
    private boolean granted = true;

    private String digitalSignature;
    private LocalDateTime grantedAt = LocalDateTime.now();
    private LocalDateTime revokedAt;
}
