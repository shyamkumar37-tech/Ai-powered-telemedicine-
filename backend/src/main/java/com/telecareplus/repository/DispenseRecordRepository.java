package com.telecareplus.repository;

import com.telecareplus.entity.DispenseRecord;
import com.telecareplus.entity.enums.DispenseStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DispenseRecordRepository extends JpaRepository<DispenseRecord, Long> {
    List<DispenseRecord> findByPharmacistIdOrderByCreatedAtDesc(Long pharmacistId);
    long countByPharmacistIdAndStatus(Long pharmacistId, DispenseStatus status);
    long countByPharmacistIdAndDispensedAtAfter(Long pharmacistId, LocalDateTime after);
    Optional<DispenseRecord> findByPrescriptionId(Long prescriptionId);
    boolean existsByPatientIdAndPharmacistUserId(Long patientId, Long userId);

    @Query("""
        select case when count(record) > 0 then true else false end
        from DispenseRecord record
        where record.id = :dispenseRecordId
          and record.pharmacist.user.id = :userId
    """)
    boolean existsByIdAndPharmacistUserId(@Param("dispenseRecordId") Long dispenseRecordId, @Param("userId") Long userId);
}
