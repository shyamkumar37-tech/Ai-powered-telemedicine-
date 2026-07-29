package com.telecareplus.notification;

import com.telecareplus.notification.AlertNotification;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlertNotificationRepository extends JpaRepository<AlertNotification, Long> {
    List<AlertNotification> findByPatientIdAndActiveTrueOrderByCreatedAtDesc(Long patientId);
    boolean existsByIdAndPatientId(Long alertNotificationId, Long patientId);
}
