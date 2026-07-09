package com.telecareplus.repository;

import com.telecareplus.entity.AlertNotification;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlertNotificationRepository extends JpaRepository<AlertNotification, Long> {
    List<AlertNotification> findByPatientIdAndActiveTrueOrderByCreatedAtDesc(Long patientId);
    boolean existsByIdAndPatientId(Long alertNotificationId, Long patientId);
}
