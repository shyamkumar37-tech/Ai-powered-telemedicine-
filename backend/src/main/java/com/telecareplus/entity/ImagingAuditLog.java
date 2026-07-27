package com.telecareplus.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "imaging_audit_logs")
@Data
@NoArgsConstructor
public class ImagingAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long imageId;

    @Column(nullable = false)
    private String action; // e.g. "UPLOADED", "ANALYZED", "CANCELED", "VIEWED"

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false)
    private Long userId;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
