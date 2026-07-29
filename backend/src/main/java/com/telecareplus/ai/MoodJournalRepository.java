package com.telecareplus.ai;

import com.telecareplus.ai.MoodJournalEntry;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MoodJournalRepository extends JpaRepository<MoodJournalEntry, Long> {
    List<MoodJournalEntry> findByPatientIdOrderByCreatedAtDesc(Long patientId);
}
