package com.telecareplus.clinical;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DicomStudyRepository extends JpaRepository<DicomStudy, Long> {
    List<DicomStudy> findByPatientIdOrderByStudyDateDesc(Long patientId);
    Optional<DicomStudy> findByStudyInstanceUid(String studyInstanceUid);
}
