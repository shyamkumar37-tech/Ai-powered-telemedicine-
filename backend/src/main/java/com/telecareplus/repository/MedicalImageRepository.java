package com.telecareplus.repository;

import com.telecareplus.entity.MedicalImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalImageRepository extends JpaRepository<MedicalImage, Long> {
    List<MedicalImage> findByPatientIdOrderByUploadedAtDesc(Long patientId);
}
