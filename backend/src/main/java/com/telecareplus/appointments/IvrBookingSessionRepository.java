package com.telecareplus.appointments;

import com.telecareplus.appointments.IvrBookingSession;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IvrBookingSessionRepository extends JpaRepository<IvrBookingSession, Long> {
    List<IvrBookingSession> findByPatientIdOrderByCreatedAtDesc(Long patientId);
}
