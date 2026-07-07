package com.telecareplus.repository;

import com.telecareplus.entity.IvrBookingSession;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IvrBookingSessionRepository extends JpaRepository<IvrBookingSession, Long> {
    List<IvrBookingSession> findByPatientIdOrderByCreatedAtDesc(Long patientId);
}
