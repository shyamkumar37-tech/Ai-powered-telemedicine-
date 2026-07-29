package com.telecareplus.ai;

import com.telecareplus.ai.AiDtos;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class AiVoiceIntakeService {

    private final Map<String, VoiceSession> sessions = new ConcurrentHashMap<>();

    public AiDtos.VoiceIntakeStartResponse start(AiDtos.VoiceIntakeStartRequest request) {
        String sessionId = UUID.randomUUID().toString();
        VoiceSession session = new VoiceSession();
        sessions.put(sessionId, session);
        return new AiDtos.VoiceIntakeStartResponse(sessionId, session.getCurrentPrompt());
    }

    public AiDtos.VoiceIntakeProcessResponse process(AiDtos.VoiceIntakeProcessRequest request) {
        VoiceSession session = sessions.get(request.sessionId());
        if (session == null) {
            return new AiDtos.VoiceIntakeProcessResponse(request.sessionId(), "Session expired. Please restart voice intake.", "symptoms", false);
        }
        session.capture(request.stepId(), request.transcript());
        session.advance();
        return new AiDtos.VoiceIntakeProcessResponse(
                request.sessionId(),
                session.getCurrentPrompt(),
                session.getCurrentStepId(),
                session.isCompleted()
        );
    }

    public AiDtos.VoiceIntakeSummaryResponse finalizeSession(AiDtos.VoiceIntakeFinalizeRequest request) {
        VoiceSession session = sessions.remove(request.sessionId());
        if (session == null) {
            return new AiDtos.VoiceIntakeSummaryResponse(
                    request.sessionId(),
                    "No active intake session was found. Please restart voice intake.",
                    "",
                    "",
                    "",
                    "",
                    "Voice intake is supportive only and must be reviewed by a clinician."
            );
        }

        String summary = "Symptoms: " + session.symptoms
                + ". Duration: " + session.duration
                + ". Severity: " + session.severity
                + ". Red flags: " + session.redFlags + ".";

        return new AiDtos.VoiceIntakeSummaryResponse(
                request.sessionId(),
                summary,
                session.symptoms,
                session.duration,
                session.severity,
                session.redFlags,
                "Voice intake is supportive only and must be reviewed by a clinician."
        );
    }

    private static class VoiceSession {
        private final Map<String, String> captured = new LinkedHashMap<>();
        private final String[] steps = {"symptoms", "duration", "severity", "redFlags"};
        private int index = 0;
        private String symptoms = "";
        private String duration = "";
        private String severity = "";
        private String redFlags = "";

        String getCurrentStepId() {
            return steps[Math.min(index, steps.length - 1)];
        }

        String getCurrentPrompt() {
            if (index >= steps.length) {
                return "Intake complete. Review and finalize summary.";
            }
            return switch (steps[index]) {
                case "symptoms" -> "What symptoms is the patient describing?";
                case "duration" -> "How long have these symptoms been present?";
                case "severity" -> "How severe are the symptoms (mild, moderate, severe)?";
                case "redFlags" -> "Any red flag symptoms like chest pain, fainting, or severe breathlessness?";
                default -> "Provide the next detail.";
            };
        }

        void capture(String stepId, String transcript) {
            String value = transcript == null ? "" : transcript.trim();
            captured.put(stepId, value);
            switch (stepId) {
                case "symptoms" -> symptoms = value;
                case "duration" -> duration = value;
                case "severity" -> severity = value;
                case "redFlags" -> redFlags = value;
                default -> {}
            }
        }

        void advance() {
            index = Math.min(index + 1, steps.length);
        }

        boolean isCompleted() {
            return index >= steps.length;
        }
    }
}
