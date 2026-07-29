package com.telecareplus.clinical;

import com.telecareplus.common.BaseEntity;
import com.telecareplus.users.Patient;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "dicom_study")
public class DicomStudy extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(nullable = false, unique = true)
    private String studyInstanceUid;

    private String seriesInstanceUid;

    @Column(nullable = false)
    private String modality; // e.g. "CT", "MRI", "XRAY", "ULTRASOUND"

    private String studyDescription;
    private String wadoUrl; // Web Access to DICOM Persistent Objects URL
    private LocalDateTime studyDate = LocalDateTime.now();
}
