package com.telecareplus.ai.service;

import com.telecareplus.ai.dto.AiInsightDtos;
import com.telecareplus.ai.entity.MoodJournalEntry;
import com.telecareplus.ai.ml.SentimentService;
import com.telecareplus.ai.repository.MoodJournalRepository;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MoodJournalService {

    private final MoodJournalRepository moodJournalRepository;
    private final SentimentService sentimentService;

    public AiInsightDtos.MoodEntryResponse logEntry(Long patientId, AiInsightDtos.MoodEntryRequest request) {
        MoodJournalEntry entry = new MoodJournalEntry();
        entry.setPatientId(patientId);
        entry.setMoodScore(request.moodScore());
        entry.setNotes(request.notes());
        MoodJournalEntry saved = moodJournalRepository.save(entry);
        return toResponse(saved);
    }

    public List<AiInsightDtos.MoodEntryResponse> getEntries(Long patientId) {
        return moodJournalRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream().map(this::toResponse).toList();
    }

    public AiInsightDtos.MoodTrendResponse buildTrend(Long patientId) {
        List<MoodJournalEntry> entries = moodJournalRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
        if (entries.isEmpty()) {
            return new AiInsightDtos.MoodTrendResponse(
                    "No mood entries recorded yet.",
                    List.of("Encourage daily check-ins to build trend awareness."),
                    "Mood insights are supportive, not diagnostic."
            );
        }
        double avg = entries.stream().mapToInt(MoodJournalEntry::getMoodScore).average().orElse(0.0);
        String summary = avg >= 7 ? "Overall mood trend is stable." : avg >= 4 ? "Mood trend shows some fluctuations." : "Mood trend indicates persistent low mood.";
        List<String> highlights = new ArrayList<>();
        highlights.add("Average mood score: " + Math.round(avg * 10.0) / 10.0);
        highlights.add("Latest entry recorded on " + entries.get(0).getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE));
        String latestNotes = entries.get(0).getNotes();
        sentimentService.analyze(latestNotes)
                .ifPresent(result -> highlights.add("Sentiment model suggests " + result.label() + " tone (" + Math.round(result.score() * 100) + "%)."));
        return new AiInsightDtos.MoodTrendResponse(
                summary,
                highlights,
                "Mood insights are supportive, not diagnostic."
        );
    }

    private AiInsightDtos.MoodEntryResponse toResponse(MoodJournalEntry entry) {
        return new AiInsightDtos.MoodEntryResponse(
                entry.getId(),
                entry.getMoodScore(),
                entry.getNotes(),
                entry.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        );
    }
}
