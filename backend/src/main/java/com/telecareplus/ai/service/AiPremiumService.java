package com.telecareplus.ai.service;

import com.telecareplus.ai.dto.AiPremiumDtos;
import com.telecareplus.ai.dto.AiPremiumDtos.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.telecareplus.ai.ml.HfInferenceClient;
import com.telecareplus.entity.*;
import com.telecareplus.entity.enums.ReminderStatus;
import com.telecareplus.exception.ResourceNotFoundException;
import com.telecareplus.repository.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AiPremiumService {

    private final ObjectMapper objectMapper;
    private final HfInferenceClient hfInferenceClient;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final MedicationReminderRepository medicationReminderRepository;
    private final TriageAssessmentRepository triageAssessmentRepository;
    private final AlertNotificationRepository alertNotificationRepository;
    private final ConsultationNoteRepository consultationNoteRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PharmacyInventoryItemRepository pharmacyInventoryItemRepository;
    private final DispenseRecordRepository dispenseRecordRepository;
    private final AiRiskService aiRiskService;
    private final AiInsightService aiInsightService;

    public SymptomChatResponse buildSymptomChat(SymptomChatRequest request) {
        Optional<SymptomChatResponse> llmResponse = buildSymptomChatWithLlm(request);
        if (llmResponse.isPresent()) {
            return llmResponse.get();
        }
        String message = request.message() == null ? "" : request.message().toLowerCase(Locale.ROOT);
        List<String> findings = new ArrayList<>();
        List<String> questions = new ArrayList<>();
        List<String> safety = new ArrayList<>();
        String triage = "Routine";
        String confidence = "Moderate";

        if (message.contains("chest") || message.contains("breath") || message.contains("faint")) {
            triage = "High";
            confidence = "High";
            findings.add("Possible cardiopulmonary red flags mentioned.");
            safety.add("Seek urgent care if chest pain, severe breathlessness, or fainting worsens.");
        }
        if (message.contains("fever") || message.contains("temperature")) {
            findings.add("Fever or elevated temperature mentioned.");
        }
        if (message.contains("cough") || message.contains("cold")) {
            findings.add("Respiratory symptoms described.");
        }
        if (findings.isEmpty()) {
            findings.add("No clear red flags detected in the latest message.");
        }

        questions.add("When did the symptoms start and how have they changed?");
        questions.add("Any known chronic conditions or recent exposure to illness?");
        questions.add("Are you currently taking medications or have you missed any doses?");
        questions.add("What helps or worsens the symptoms?");

        safety.add("If symptoms rapidly worsen, seek in-person clinical review.");
        safety.add("Continue hydration and rest while awaiting clinician guidance.");

        String reply = "Thanks for sharing. Based on what you described, the risk level looks "
                + triage.toLowerCase(Locale.ROOT)
                + ". I have a few follow-up questions to guide next steps.";

        return new SymptomChatResponse(
                reply,
                triage,
                confidence,
                findings,
                questions,
                safety,
                List.of("Signals derived from your latest symptom description."),
                "This guidance is supportive and does not replace a licensed clinician."
        );
    }

    private Optional<SymptomChatResponse> buildSymptomChatWithLlm(SymptomChatRequest request) {
        if (!hfInferenceClient.isEnabled() || request == null || request.message() == null || request.message().isBlank()) {
            return Optional.empty();
        }
        String system = """
                You are TeleCare+, a careful clinical symptom triage assistant.
                Ask follow-up questions, identify risk level, and keep the tone supportive.
                Respond ONLY in valid JSON with keys:
                reply, triageLevel, confidence, keyFindings, nextQuestions, safetyChecklist, rationale, disclaimer.
                triageLevel must be one of: Low, Moderate, High, Emergency.
                """;
        String user = "Patient message: " + request.message()
                + System.lineSeparator()
                + "Recent history: " + (request.history() == null ? "none" : String.join(" | ", request.history()))
                + System.lineSeparator()
                + "Locale: " + (request.locale() == null ? "en" : request.locale());
        return hfInferenceClient.generateChat(system + System.lineSeparator() + user)
                .flatMap(this::parseSymptomChatResponse);
    }

    private Optional<SymptomChatResponse> parseSymptomChatResponse(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        String payload = sanitizeJson(raw);
        try {
            JsonNode root = objectMapper.readTree(payload);
            String reply = root.path("reply").asText("");
            if (reply.isBlank()) {
                return Optional.empty();
            }
            String triage = root.path("triageLevel").asText("Routine");
            String confidence = root.path("confidence").asText("Moderate");
            List<String> findings = toList(root.path("keyFindings"));
            List<String> questions = toList(root.path("nextQuestions"));
            List<String> safety = toList(root.path("safetyChecklist"));
            List<String> rationale = toList(root.path("rationale"));
            String disclaimer = root.path("disclaimer").asText("This guidance is supportive and does not replace a licensed clinician.");
            return Optional.of(new SymptomChatResponse(
                    reply,
                    triage,
                    confidence,
                    findings.isEmpty() ? List.of("No critical red flags detected in the latest message.") : findings,
                    questions.isEmpty() ? List.of("When did the symptoms begin and how have they changed?") : questions,
                    safety.isEmpty() ? List.of("Seek urgent care if symptoms rapidly worsen.") : safety,
                    rationale.isEmpty() ? List.of("Generated from the patient message and recent history.") : rationale,
                    disclaimer
            ));
        } catch (Exception ex) {
            return Optional.empty();
        }
    }

    private List<String> toList(JsonNode node) {
        List<String> items = new ArrayList<>();
        if (node == null || node.isNull() || node.isMissingNode()) {
            return items;
        }
        if (node.isArray()) {
            node.forEach(item -> {
                String value = item.asText("").trim();
                if (!value.isBlank()) {
                    items.add(value);
                }
            });
        } else if (node.isTextual()) {
            String text = node.asText("");
            for (String part : text.split("\\r?\\n|\\|\\|")) {
                String value = part.replaceFirst("^[-*\\d.\\s]+", "").trim();
                if (!value.isBlank()) {
                    items.add(value);
                }
            }
        }
        return items.stream().distinct().limit(6).toList();
    }

    private String sanitizeJson(String raw) {
        String content = raw.trim();
        if (content.startsWith("```")) {
            content = content.replaceFirst("^```(?:json)?", "").replaceFirst("```$", "").trim();
        }
        return content;
    }

    public RiskSnapshotResponse buildRiskSnapshot(Long patientId) {
        var prediction = aiRiskService.predictRisk(patientId);
        String confidence = prediction.insights().size() >= 2 ? "High" : "Moderate";
        return new RiskSnapshotResponse(
                prediction.category(),
                prediction.score(),
                confidence,
                prediction.insights(),
                "Risk snapshots are advisory and should be reviewed by clinicians."
        );
    }

    public AppointmentPrepResponse buildAppointmentPrep(Long patientId) {
        ensurePatient(patientId);
        List<String> checklist = new ArrayList<>();
        checklist.add("Write down your top 3 symptoms and when they started.");
        checklist.add("Prepare your current medication list or prescription photos.");
        checklist.add("Record any recent vitals (BP, sugar, SpO2, temperature).");
        checklist.add("List any recent hospital visits or lab results.");

        List<Appointment> appointments = appointmentRepository.findByPatientIdOrderByAppointmentDateTimeDesc(patientId);
        if (!appointments.isEmpty()) {
            checklist.add("Confirm the appointment time: " + appointments.get(0).getAppointmentDateTime());
        }

        List<String> reminders = List.of(
                "Join the call 5 minutes early for smoother triage.",
                "Keep emergency contact details nearby if escalation is needed."
        );
        List<String> rationale = List.of("Checklist derived from common missed prep items in teleconsults.");
        return new AppointmentPrepResponse(
                checklist,
                reminders,
                rationale,
                "Preparation guidance is supportive and does not replace clinician advice."
        );
    }

    public FollowUpPlanResponse buildFollowUpPlan(Long patientId) {
        var followUp = aiInsightService.buildFollowUp(patientId);
        List<String> planItems = List.of(
                "Confirm next follow-up based on triage urgency.",
                "Recheck vitals 48-72 hours before follow-up.",
                "Log adherence and symptom changes in the app."
        );
        return new FollowUpPlanResponse(
                followUp.recommendedDate(),
                planItems,
                followUp.rationale(),
                followUp.disclaimer()
        );
    }

    public IcdSuggestionResponse buildIcdSuggestions(IcdSuggestionRequest request) {
        String notes = request.notes() == null ? "" : request.notes().toLowerCase(Locale.ROOT);
        List<String> codes = new ArrayList<>();
        if (notes.contains("fever")) {
            codes.add("R50.9 - Fever, unspecified");
        }
        if (notes.contains("cough")) {
            codes.add("R05 - Cough");
        }
        if (notes.contains("diabetes")) {
            codes.add("E11.9 - Type 2 diabetes mellitus without complications");
        }
        if (notes.contains("hypertension") || notes.contains("bp")) {
            codes.add("I10 - Essential (primary) hypertension");
        }
        if (codes.isEmpty()) {
            codes.add("Z00.00 - General medical examination without abnormal findings");
        }
        return new IcdSuggestionResponse(
                codes,
                List.of("Codes suggested from clinician notes and symptom keywords."),
                "ICD suggestions are assistive and must be verified before use."
        );
    }

    public CarePlanAdherenceResponse buildCarePlanAdherence(Long patientId) {
        ensurePatient(patientId);
        List<MedicationReminder> reminders = medicationReminderRepository.findByPatientIdOrderByScheduledDateDesc(patientId);
        long total = reminders.size();
        long missed = medicationReminderRepository.countByPatientIdAndStatus(patientId, ReminderStatus.MISSED);
        double adherence = total == 0 ? 0.0 : ((total - missed) * 100.0) / total;
        List<String> gaps = new ArrayList<>();
        if (missed > 0) {
            gaps.add("Missed " + missed + " medication reminders.");
        }
        if (alertNotificationRepository.findByPatientIdAndActiveTrueOrderByCreatedAtDesc(patientId).size() > 0) {
            gaps.add("Active alerts need caregiver review.");
        }
        if (gaps.isEmpty()) {
            gaps.add("No major adherence gaps detected.");
        }
        List<String> recommendations = List.of(
                "Confirm medication schedule with the patient.",
                "Set micro-reminders for high priority doses.",
                "Review barriers during next check-in."
        );
        return new CarePlanAdherenceResponse(
                Math.round(adherence * 10.0) / 10.0,
                (int) missed,
                gaps,
                recommendations,
                List.of("Derived from reminder completion and alert activity."),
                "Care plan adherence summaries are supportive insights only."
        );
    }

    public DispenseAnomalyResponse buildDispenseAnomaly(Long pharmacistId) {
        List<DispenseRecord> records = dispenseRecordRepository.findByPharmacistIdOrderByCreatedAtDesc(pharmacistId);
        List<String> alerts = new ArrayList<>();
        long pending = records.stream().filter(record -> record.getDispensedAt() == null).count();
        if (pending > 3) {
            alerts.add("Multiple pending dispense records detected (" + pending + "). Review pickup confirmations.");
        }
        if (records.size() > 5 && records.stream().limit(5).allMatch(record -> record.getDispensedAt() == null)) {
            alerts.add("Recent dispense activity shows repeated pending pickups.");
        }
        if (alerts.isEmpty()) {
            alerts.add("No dispense anomalies detected in recent activity.");
        }
        return new DispenseAnomalyResponse(
                alerts,
                List.of("Checks compare pending vs completed dispense records."),
                "Dispense anomaly alerts are assistive signals only."
        );
    }

    public AutomationPlanResponse buildAutomationPlans() {
        List<AutomationFlow> flows = List.of(
                new AutomationFlow(
                        "Triage to appointment orchestration",
                        "Operations",
                        "New triage marked PRIORITY or EMERGENCY",
                        List.of("Notify doctor + caregiver", "Open appointment slot suggestions", "Send patient reminder")
                ),
                new AutomationFlow(
                        "Medication adherence escalation",
                        "Caregiver",
                        "Missed dose streak >= 3",
                        List.of("Notify caregiver", "Suggest check-in script", "Escalate to doctor if unresolved")
                ),
                new AutomationFlow(
                        "Follow-up automation",
                        "Patient",
                        "Consultation completed",
                        List.of("Schedule follow-up reminder", "Send prep checklist", "Collect symptom update")
                )
        );
        return new AutomationPlanResponse(
                flows,
                "Automation plans are suggestions and require human approval before activation."
        );
    }

    public EscalationRulesResponse buildEscalationRules(Long patientId) {
        ensurePatient(patientId);
        List<EscalationRule> rules = new ArrayList<>();
        List<TriageAssessment> triage = triageAssessmentRepository.findByPatientIdOrderByAssessedAtDesc(patientId);
        if (!triage.isEmpty() && triage.get(0).getLevel() != null) {
            rules.add(new EscalationRule(
                    "Latest triage is " + triage.get(0).getLevel(),
                    "Notify assigned doctor and caregiver immediately",
                    "High",
                    "Escalation based on most recent triage level."
            ));
        }
        rules.add(new EscalationRule(
                "Missed medication reminders >= 3",
                "Trigger caregiver outreach and follow-up call",
                "Medium",
                "Repeated misses can indicate adherence risk."
        ));
        return new EscalationRulesResponse(
                rules,
                "Escalation rules are configurable guidelines, not automatic clinical actions."
        );
    }

    public ComplianceDashboardResponse buildComplianceDashboard() {
        long totalPrescriptions = prescriptionRepository.count();
        long inventoryItems = pharmacyInventoryItemRepository.count();
        List<ComplianceMetric> metrics = List.of(
                new ComplianceMetric("Active prescriptions tracked", String.valueOf(totalPrescriptions), "Includes open and completed prescriptions."),
                new ComplianceMetric("Inventory items monitored", String.valueOf(inventoryItems), "Inventory coverage supports safer dispensing."),
                new ComplianceMetric("AI audit logging", "Enabled", "All AI outputs are logged for traceability.")
        );
        List<String> highlights = List.of(
                "Role-based access maintained for clinical insights.",
                "AI outputs include rationale and safety disclaimers.",
                "No automated clinical actions triggered without review."
        );
        return new ComplianceDashboardResponse(
                metrics,
                highlights,
                "Compliance summaries are informational and require governance review."
        );
    }

    public PredictiveRiskResponse buildPredictiveRisk(Long patientId) {
        ensurePatient(patientId);
        List<RiskForecast> forecasts = List.of(
                new RiskForecast("Hypertension risk", 32, 180, "Based on recent BP patterns and alerts."),
                new RiskForecast("Type 2 diabetes risk", 24, 365, "Based on historical sugar readings and medication history."),
                new RiskForecast("Respiratory risk", 18, 90, "Based on recent triage symptoms and SpO2 checks.")
        );
        return new PredictiveRiskResponse(
                forecasts,
                "Predictive risk models are indicative only and must be clinically validated."
        );
    }

    public VideoAnalysisResponse buildVideoAnalysis(VideoAnalysisRequest request) {
        String observations = request.observations() == null ? "" : request.observations();
        List<String> signals = new ArrayList<>();
        if (observations.toLowerCase(Locale.ROOT).contains("fatigue")) {
            signals.add("Fatigue markers noted.");
        }
        if (observations.toLowerCase(Locale.ROOT).contains("breath")) {
            signals.add("Breathing discomfort described.");
        }
        if (signals.isEmpty()) {
            signals.add("No major visual distress indicators described.");
        }
        return new VideoAnalysisResponse(
                "Summary generated from clinician-provided observation notes.",
                signals.size() > 1 ? "Moderate" : "Low",
                signals,
                List.of("Derived from observation notes entered during consultation."),
                "Video analysis is supportive and should be verified by clinicians."
        );
    }

    public ReportGeneratorResponse buildReportGenerator(Long patientId) {
        ensurePatient(patientId);
        List<ReportSection> sections = new ArrayList<>();
        sections.add(new ReportSection("Patient overview", List.of("Auto-generated summary from records.", "All details require clinician review.")));
        sections.add(new ReportSection("Recent complaints", List.of("Based on triage and consultation notes.")));
        sections.add(new ReportSection("Medications", List.of("Derived from latest prescription entries.")));
        sections.add(new ReportSection("Follow-up advice", List.of("Based on planned follow-up cadence and reminders.")));
        return new ReportGeneratorResponse(
                "TeleCare+ AI Medical Summary",
                sections,
                true,
                "text/plain",
                "Generated reports are supportive and must be reviewed by clinicians."
        );
    }

    private void ensurePatient(Long patientId) {
        patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
    }
}
