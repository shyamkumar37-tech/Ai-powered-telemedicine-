package com.telecareplus.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "medical_images")
@Data
@NoArgsConstructor
public class MedicalImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long patientId;

    @Column(nullable = false)
    private Long doctorId;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String fileType;

    @Column(nullable = false)
    private Long fileSize;

    @Column(nullable = false)
    private String filePath;

    @Column(nullable = false)
    private String status; // UPLOADING, PROCESSING, COMPLETED, FAILED, CANCELED

    @Column(columnDefinition = "TEXT")
    private String findingsJson;
    
    private String severity;

    @Column(nullable = false)
    private LocalDateTime uploadedAt;

    @Version
    private Long version;
}
