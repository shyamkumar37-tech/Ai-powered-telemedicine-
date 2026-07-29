package com.telecareplus.users;

import com.telecareplus.users.PatientChatMessage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientChatMessageRepository extends JpaRepository<PatientChatMessage, Long> {
    List<PatientChatMessage> findByPatientIdOrderByCreatedAtDesc(Long patientId);
}
