package com.telecareplus.repository;

import com.telecareplus.entity.MedicationItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MedicationItemRepository extends JpaRepository<MedicationItem, Long> {
    List<MedicationItem> findByPrescriptionId(Long prescriptionId);
    List<MedicationItem> findByPrescriptionIdIn(List<Long> prescriptionIds);
}
