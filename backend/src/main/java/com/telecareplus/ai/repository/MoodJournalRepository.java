package com.telecareplus.ai.repository;

import com.telecareplus.ai.entity.MoodJournalEntry;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MoodJournalRepository extends JpaRepository<MoodJournalEntry, Long> {
    List<MoodJournalEntry> findByPatientIdOrderByCreatedAtDesc(Long patientId);
}
