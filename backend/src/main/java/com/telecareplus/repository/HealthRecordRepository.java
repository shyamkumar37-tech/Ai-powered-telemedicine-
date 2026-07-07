package com.telecareplus.repository;

import com.telecareplus.entity.HealthRecord;
import com.telecareplus.entity.enums.AlertSeverity;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface HealthRecordRepository extends JpaRepository<HealthRecord, Long> {
    List<HealthRecord> findByPatientIdOrderByRecordedAtDesc(Long patientId);
    List<HealthRecord> findTop10ByPatientIdOrderByRecordedAtDesc(Long patientId);
    HealthRecord findTopByPatientIdOrderByRecordedAtDesc(Long patientId);

    @Query("""
        select healthRecord.sugar as sugar,
               healthRecord.spo2 as spo2,
               healthRecord.pulse as pulse,
               healthRecord.bloodPressure as bloodPressure,
               healthRecord.alertSeverity as alertSeverity,
               healthRecord.alertMessage as alertMessage,
               healthRecord.recordedAt as recordedAt
        from HealthRecord healthRecord
        where healthRecord.patient.id = :patientId
        order by healthRecord.recordedAt desc
    """)
    List<HealthSummaryRow> findSummaryRowsByPatientId(Long patientId, Pageable pageable);

    interface HealthSummaryRow {
        Double getSugar();
        Double getSpo2();
        Double getPulse();
        String getBloodPressure();
        AlertSeverity getAlertSeverity();
        String getAlertMessage();
        LocalDateTime getRecordedAt();
    }
}
