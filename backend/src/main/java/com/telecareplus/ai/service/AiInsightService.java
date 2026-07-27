package com.telecareplus.ai.service;

import com.telecareplus.ai.dto.AiInsightDtos;
import com.telecareplus.ai.dto.AiInsightDtos.*;
import com.telecareplus.entity.*;
import com.telecareplus.entity.enums.ReminderStatus;
import com.telecareplus.exception.ResourceNotFoundException;
import com.telecareplus.repository.*;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AiInsightService {

    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final MedicationReminderRepository medicationReminderRepository;
    private final HealthRecordRepository healthRecordRepository;
    private final TriageAssessmentRepository triageAssessmentRepository;
    private final AlertNotificationRepository alertNotificationRepository;
    private final ConsultationNoteRepository consultationNoteRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicationItemRepository medicationItemRepository;
    private final PatientCaregiverLinkRepository patientCaregiverLinkRepository;
    private final PharmacyInventoryItemRepository pharmacyInventoryItemRepository;
    private final DispenseRecordRepository dispenseRecordRepository;

    public AdherenceCoachResponse buildAdherenceCoach(long patientId) {
        ensurePatient(patientId);
        List<MedicationReminder> reminders = medicationReminderRepository.findByPatientIdOrderByScheduledDateDesc(patientId);
        long total = reminders.size();
        long taken = medicationReminderRepository.countByPatientIdAndStatus(patientId, ReminderStatus.TAKEN);
        long missed = medicationReminderRepository.countByPatientIdAndStatus(patientId, ReminderStatus.MISSED);
        double adherence = total == 0 ? 0.0 : (taken * 100.0) / total;
        int streak = calculateMissedStreak(reminders);
        List<String> nudges = new ArrayList<>();
        if (total == 0) {
            nudges.add("Set up reminders to start tracking adherence.");
        } else if (adherence < 75) {
            nudges.add("Adherence is below target. Consider smaller, consistent reminder goals.");
        } else {
            nudges.add("Great adherence streak. Keep logging doses to maintain momentum.");
        }
        if (streak >= 3) {
            nudges.add("Missed doses for " + streak + " consecutive reminders. Check barriers or adjust schedule.");
        }
        List<String> rationale = List.of(
                "Based on " + total + " total reminders and " + missed + " missed doses.",
                "Latest missed streak: " + streak
        );
        return new AdherenceCoachResponse(
                Math.round(adherence * 10.0) / 10.0,
                total,
                missed,
                streak,
                nudges,
                rationale,
                "Adherence coaching is supportive guidance, not clinical advice."
        );
    }

    public HealthTrendResponse buildHealthTrends(long patientId) {
        ensurePatient(patientId);
        List<HealthRecord> records = healthRecordRepository.findByPatientIdOrderByRecordedAtDesc(patientId);
        if (records.isEmpty()) {
            return new HealthTrendResponse(
                    "No recent vitals recorded.",
                    List.of("Log BP, sugar, SpO2, or temperature to enable trend insights."),
                    List.of("Encourage daily vitals logging."),
                    List.of("No vitals on record."),
                    "Health trends are supportive summaries, not diagnoses."
            );
        }
        HealthRecord latest = records.get(0);
        List<String> trends = new ArrayList<>();
        List<String> guidance = new ArrayList<>();
        if (latest.getBloodPressure() != null) {
            trends.add("Latest BP: " + latest.getBloodPressure());
        }
        if (latest.getSugar() != null) {
            trends.add("Latest sugar: " + latest.getSugar());
        }
        if (latest.getSpo2() != null) {
            trends.add("Latest SpO2: " + latest.getSpo2());
            if (latest.getSpo2() < 94) {
                guidance.add("SpO2 is low. Monitor breathing and consider clinical review.");
            }
        }
        if (latest.getTemperature() != null) {
            trends.add("Latest temperature: " + latest.getTemperature());
        }
        if (guidance.isEmpty()) {
            guidance.add("Continue regular monitoring and hydration.");
        }
        return new HealthTrendResponse(
                "Trends reflect the latest " + records.size() + " records.",
                trends,
                guidance,
                List.of("Based on " + records.size() + " stored health records."),
                "Health trends are supportive summaries, not diagnoses."
        );
    }

    public SymptomTrendResponse buildSymptomTrends(long patientId) {
        ensurePatient(patientId);
        List<TriageAssessment> assessments = triageAssessmentRepository.findByPatientIdOrderByAssessedAtDesc(patientId);
        if (assessments.isEmpty()) {
            return new SymptomTrendResponse(
                    "No recent symptom assessments.",
                    List.of("Log your symptoms via Triage to see trends over time."),
                    List.of("No triage data found for patient " + patientId),
                    "Symptom trends are for informational purposes only."
            );
        }

        List<String> trends = assessments.stream()
                .limit(5)
                .map(a -> a.getAssessedAt().toLocalDate() + ": " + a.getSymptoms() + " (" + a.getLevel().name() + ")")
                .collect(Collectors.toList());

        return new SymptomTrendResponse(
                "Recent symptom history based on latest triage assessments.",
                trends,
                List.of("Analyzed " + trends.size() + " recent triage logs."),
                "Always consult a doctor for severe or worsening symptoms."
        );
    }

    public ConsultationPrepResponse buildConsultationPrep(long patientId) {
        ensurePatient(patientId);
        List<String> talkingPoints = new ArrayList<>();
        List<String> rationale = new ArrayList<>();

        // 1. Triage history
        List<TriageAssessment> recentTriage = triageAssessmentRepository.findByPatientIdOrderByAssessedAtDesc(patientId).stream()
                .filter(t -> t.getAssessedAt().isAfter(java.time.LocalDateTime.now().minusWeeks(2)))
                .toList();
        if (!recentTriage.isEmpty()) {
            talkingPoints.add("Reported symptoms: " + recentTriage.get(0).getSymptoms() + " (Urgency: " + recentTriage.get(0).getLevel().name() + ")");
            rationale.add("Included recent triage assessment from " + recentTriage.get(0).getAssessedAt().toLocalDate());
        }

        // 2. Out of range health records
        List<HealthRecord> recentVitals = healthRecordRepository.findByPatientIdOrderByRecordedAtDesc(patientId).stream()
                .filter(h -> h.getRecordedAt().isAfter(java.time.LocalDateTime.now().minusWeeks(2)))
                .toList();
        boolean hasAbnormalVitals = false;
        for (HealthRecord hr : recentVitals) {
            if (hr.getSpo2() != null && hr.getSpo2() < 94) {
                talkingPoints.add("SpO2 dipped below 94% on " + hr.getRecordedAt().toLocalDate() + " (Recorded: " + hr.getSpo2() + "%)");
                hasAbnormalVitals = true;
            }
        }
        if (hasAbnormalVitals) {
            rationale.add("Highlighted abnormal vital readings from the last 2 weeks.");
        }

        // 3. Missed medications
        List<MedicationReminder> missedMeds = medicationReminderRepository.findByPatientIdOrderByScheduledDateDesc(patientId).stream()
                .filter(m -> m.getStatus() == ReminderStatus.MISSED && m.getScheduledDate().isAfter(java.time.LocalDate.now().minusWeeks(2)))
                .toList();
        if (!missedMeds.isEmpty()) {
            long distinctMeds = missedMeds.stream().map(m -> m.getMedicationItem().getMedicineName()).distinct().count();
            talkingPoints.add("Missed doses for " + distinctMeds + " medication(s) in the last 2 weeks.");
            rationale.add("Counted missed medication reminders in the last 2 weeks.");
        }

        if (talkingPoints.isEmpty()) {
            talkingPoints.add("No specific recent issues logged. Routine follow-up.");
        }

        return new ConsultationPrepResponse(
                "Consultation Prep Summary",
                talkingPoints,
                rationale,
                "This summary is generated by AI to help guide your consultation. It does not replace a doctor's full assessment."
        );
    }

    public FollowUpRecommendationResponse buildFollowUp(long patientId) {
        ensurePatient(patientId);
        LocalDate recommended = LocalDate.now().plusDays(21);
        String urgency = "Routine";
        List<TriageAssessment> triage = triageAssessmentRepository.findByPatientIdOrderByAssessedAtDesc(patientId);
        if (!triage.isEmpty()) {
            switch (triage.get(0).getLevel()) {
                case EMERGENCY_GO_TO_HOSPITAL, IN_PERSON_VISIT_RECOMMENDED -> {
                    recommended = LocalDate.now().plusDays(3);
                    urgency = "High";
                }
                case PRIORITY_CONSULTATION -> {
                    recommended = LocalDate.now().plusDays(7);
                    urgency = "Medium";
                }
                default -> {
                }
            }
        }
        List<String> rationale = List.of("Follow-up timing estimated from recent triage and appointment cadence.");
        return new FollowUpRecommendationResponse(
                recommended,
                urgency,
                rationale,
                "Follow-up suggestions are assistive; clinicians decide final scheduling."
        );
    }

    public JourneyPlanResponse buildJourneyPlan(long patientId) {
        ensurePatient(patientId);
        List<JourneyStep> steps = new ArrayList<>();
        List<TriageAssessment> triage = triageAssessmentRepository.findByPatientIdOrderByAssessedAtDesc(patientId);
        steps.add(new JourneyStep("Latest triage", triage.isEmpty() ? "Pending" : "Completed",
                triage.isEmpty() ? "" : triage.get(0).getAssessedAt().toLocalDate().toString(),
                triage.isEmpty() ? "Complete triage to unlock tailored scheduling." : "Latest triage level: " + triage.get(0).getLevel()));
        List<Appointment> appointments = appointmentRepository.findByPatientIdOrderByAppointmentDateTimeDesc(patientId);
        steps.add(new JourneyStep("Next appointment", appointments.isEmpty() ? "Not scheduled" : "Scheduled",
                appointments.isEmpty() ? "" : appointments.get(0).getAppointmentDateTime().toLocalDate().toString(),
                appointments.isEmpty() ? "Book a follow-up appointment." : "Appointment status: " + appointments.get(0).getStatus()));
        long missed = medicationReminderRepository.countByPatientIdAndStatus(patientId, ReminderStatus.MISSED);
        steps.add(new JourneyStep("Medication adherence", missed > 0 ? "Needs attention" : "On track", "", missed > 0 ? "Missed reminders detected." : "No missed reminders detected."));
        return new JourneyPlanResponse(
                "Your care journey checklist for the next 7-14 days.",
                steps,
                "Journey steps guide continuity planning; they do not replace clinical judgment."
        );
    }

    public RiskQueueResponse buildDoctorRiskQueue(long doctorId, AiRiskService aiRiskService) {
        List<Appointment> appointments = appointmentRepository.findByDoctorIdOrderByAppointmentDateTimeDesc(doctorId);
        Map<Long, String> patientNames = appointments.stream()
                .filter(appointment -> appointment.getPatient() != null && appointment.getPatient().getUser() != null)
                .collect(Collectors.toMap(
                        appointment -> appointment.getPatient().getId(),
                        appointment -> appointment.getPatient().getUser().getFullName(),
                        (a, b) -> a
                ));
        List<RiskQueueItem> items = patientNames.entrySet().stream()
                .map(entry -> {
                    var prediction = aiRiskService.predictRisk(entry.getKey());
                    return new RiskQueueItem(entry.getKey(), entry.getValue(), prediction.category(), prediction.score(), prediction.insights());
                })
                .sorted(Comparator.comparingInt(RiskQueueItem::score).reversed())
                .limit(10)
                .toList();
        return new RiskQueueResponse(items, "Risk queue prioritizes patients using recent signals and is for review only.");
    }

    public PriorityQueueResponse buildCaregiverPriorityQueue(long caregiverId) {
        List<PatientCaregiverLink> links = patientCaregiverLinkRepository.findByCaregiverIdAndActiveTrue(caregiverId);
        List<PriorityQueueItem> items = new ArrayList<>();
        for (PatientCaregiverLink link : links) {
            Long patientId = link.getPatient().getId();
            String name = link.getPatient().getUser().getFullName();
            long missed = medicationReminderRepository.countByPatientIdAndStatus(patientId, ReminderStatus.MISSED);
            int alerts = alertNotificationRepository.findByPatientIdAndActiveTrueOrderByCreatedAtDesc(patientId).size();
            int score = (int) (missed * 2 + alerts * 3);
            List<String> reasons = new ArrayList<>();
            if (missed > 0) reasons.add("Missed reminders: " + missed);
            if (alerts > 0) reasons.add("Active alerts: " + alerts);
            if (reasons.isEmpty()) reasons.add("Stable adherence and no active alerts.");
            items.add(new PriorityQueueItem(patientId, name, score, reasons));
        }
        items.sort(Comparator.comparingInt(PriorityQueueItem::priorityScore).reversed());
        return new PriorityQueueResponse(items, "Priority queue suggests where caregiver attention may be needed first.");
    }

    public BehavioralDeviationResponse buildBehavioralDeviation(long patientId) {
        ensurePatient(patientId);
        List<String> alerts = new ArrayList<>();
        int streak = calculateMissedStreak(medicationReminderRepository.findByPatientIdOrderByScheduledDateDesc(patientId));
        if (streak >= 3) {
            alerts.add("Medication missed for " + streak + " consecutive reminders.");
        }
        List<AlertNotification> activeAlerts = alertNotificationRepository.findByPatientIdAndActiveTrueOrderByCreatedAtDesc(patientId);
        if (!activeAlerts.isEmpty()) {
            alerts.add("Active health alerts: " + activeAlerts.size());
        }
        if (alerts.isEmpty()) {
            alerts.add("No recent deviations detected.");
        }
        return new BehavioralDeviationResponse(
                alerts,
                List.of("Deviation checks use missed reminders and active alerts."),
                "Behavioral deviation alerts are supportive signals only."
        );
    }

    public CheckInScriptResponse buildCheckInScript(long patientId) {
        ensurePatient(patientId);
        List<String> scriptLines = new ArrayList<>();
        scriptLines.add("Greet the patient and confirm how they are feeling today.");
        int missed = calculateMissedStreak(medicationReminderRepository.findByPatientIdOrderByScheduledDateDesc(patientId));
        if (missed > 0) {
            scriptLines.add("Ask about missed medications in the last " + missed + " reminders.");
        }
        List<AlertNotification> alerts = alertNotificationRepository.findByPatientIdAndActiveTrueOrderByCreatedAtDesc(patientId);
        if (!alerts.isEmpty()) {
            scriptLines.add("Discuss the recent alert: " + alerts.get(0).getMessage());
        }
        scriptLines.add("Confirm next appointment or follow-up plan.");
        return new CheckInScriptResponse(
                String.join(" ", scriptLines),
                List.of("Script uses latest adherence and alert information."),
                "Check-in scripts are suggestions; personalize as needed."
        );
    }

    public ConsultationSummaryResponse buildConsultationSummary(long consultationId) {
        ConsultationNote note = consultationNoteRepository.findById(consultationId)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation note not found"));
        String notes = Optional.ofNullable(note.getNotes()).orElse("");
        String[] parts = notes.split("\\n");
        String subjective = parts.length > 0 ? parts[0] : "Patient reported symptoms.";
        String objective = parts.length > 1 ? parts[1] : "No objective vitals captured.";
        String assessment = parts.length > 2 ? parts[2] : "Assessment pending clinician review.";
        String plan = parts.length > 3 ? parts[3] : "Plan includes follow-up and medication guidance.";
        List<String> codes = deriveCodes(notes);
        return new ConsultationSummaryResponse(
                subjective,
                objective,
                assessment,
                plan,
                codes,
                List.of("Summary derived from consultation notes."),
                "AI summaries are assistive and must be reviewed by the clinician."
        );
    }

    public DifferentialSuggestionResponse buildDifferentialSuggestions(DifferentialSuggestionRequest request) {
        String text = ((request.symptoms() == null ? "" : request.symptoms()) + " " + (request.notes() == null ? "" : request.notes())).toLowerCase();
        List<String> suggestions = new ArrayList<>();
        if (text.contains("fever") || text.contains("temperature")) suggestions.add("Possible viral infection");
        if (text.contains("cough") || text.contains("breath")) suggestions.add("Possible respiratory infection");
        if (text.contains("chest") || text.contains("pain")) suggestions.add("Possible cardiac or musculoskeletal issue");
        if (suggestions.isEmpty()) suggestions.add("Consider general consultation for further assessment");
        return new DifferentialSuggestionResponse(
                suggestions,
                List.of("Generated from symptom keywords in notes."),
                "Differential suggestions are educational and not diagnoses."
        );
    }

    public DrugInteractionResponse buildDrugInteractions(DrugInteractionRequest request) {
        List<String> meds = request.medicines() == null ? List.of() : request.medicines().stream().map(String::toLowerCase).toList();
        List<String> warnings = new ArrayList<>();
        
        // Define our known evaluation ruleset size
        int evaluatedPairs = 0;
        
        if (meds.contains("warfarin") && (meds.contains("aspirin") || meds.contains("ibuprofen"))) {
            warnings.add("Interaction found: Warfarin with NSAIDs may increase bleeding risk.");
            evaluatedPairs++;
        }
        if (meds.contains("metformin") && meds.contains("contrast")) {
            warnings.add("Interaction found: Metformin may need withholding around contrast imaging.");
            evaluatedPairs++;
        }
        
        // If we found interactions from our known list, we report them.
        // If we found NO interactions, we MUST differentiate if we actually evaluated all combinations or not.
        // Since we only have a tiny hardcoded ruleset, any list of meds that doesn't trigger our rules is largely "Not evaluated".
        if (warnings.isEmpty()) {
            if (meds.size() < 2) {
                warnings.add("No interaction found");
            } else {
                warnings.add("Not evaluated — this combination is outside the current ruleset.");
            }
        }
        
        return new DrugInteractionResponse(
                warnings,
                List.of("Rule-based interaction screen using known high-risk combinations."),
                "Interaction checks are assistive; confirm with clinical resources."
        );
    }

    public RefillPredictionResponse buildRefillPrediction(long pharmacistId) {
        List<DispenseRecord> records = dispenseRecordRepository.findByPharmacistIdOrderByCreatedAtDesc(pharmacistId);
        if (records.isEmpty()) {
            return new RefillPredictionResponse(List.of(), "Refill predictions are approximate and depend on updated prescriptions.");
        }
        Map<String, LocalDate> predictionMap = new HashMap<>();
        for (DispenseRecord record : records) {
            medicationItemRepository.findByPrescriptionId(record.getPrescription().getId()).forEach(item -> {
                LocalDate base = record.getCreatedAt().toLocalDate();
                LocalDate refill = base.plusDays(item.getDurationDays() == null ? 7 : item.getDurationDays());
                predictionMap.put(item.getMedicineName(), refill);
            });
        }
        List<RefillPredictionItem> items = predictionMap.entrySet().stream()
                .map(entry -> new RefillPredictionItem(entry.getKey(), entry.getValue(), entry.getValue().isBefore(LocalDate.now().plusDays(7)) ? "Soon" : "On track"))
                .toList();
        return new RefillPredictionResponse(items, "Refill predictions are approximate and depend on updated prescriptions.");
    }

    public InventoryRiskResponse buildInventoryRisk(long pharmacistId) {
        List<PharmacyInventoryItem> inventory = pharmacyInventoryItemRepository.findByPharmacistIdOrderByMedicineNameAsc(pharmacistId);
        List<String> alerts = inventory.stream()
                .filter(item -> item.getQuantityAvailable() <= item.getReorderLevel())
                .map(item -> item.getMedicineName() + " is below reorder threshold.")
                .toList();
        if (alerts.isEmpty()) {
            alerts = List.of("No inventory risks detected.");
        }
        return new InventoryRiskResponse(alerts, "Inventory risk alerts are estimates based on current stock.");
    }

    public SubstitutionSuggestionResponse buildSubstitutions(SubstitutionSuggestionRequest request) {
        String name = request.medicineName() == null ? "" : request.medicineName().toLowerCase();
        List<String> suggestions = new ArrayList<>();
        if (name.contains("paracetamol")) suggestions.add("Acetaminophen (generic equivalent)");
        if (name.contains("ibuprofen")) suggestions.add("Naproxen (check suitability)");
        if (suggestions.isEmpty()) suggestions.add("No suggested substitution available.");
        return new SubstitutionSuggestionResponse(suggestions, "Substitution suggestions are informational only.");
    }

    public StressCopingResponse buildStressRecommendations(long patientId, List<AiInsightDtos.MoodEntryResponse> moodEntries) {
        ensurePatient(patientId);
        List<String> recommendations = new ArrayList<>();
        if (moodEntries != null && !moodEntries.isEmpty() && moodEntries.get(0).moodScore() <= 4) {
            recommendations.add("Try 5-minute breathing exercises twice daily.");
            recommendations.add("Schedule a short walk or light stretching.");
            recommendations.add("Reach out to a caregiver or clinician if stress persists.");
        } else {
            recommendations.add("Maintain regular sleep routines.");
            recommendations.add("Keep a short daily mood note.");
        }
        return new StressCopingResponse(
                recommendations,
                List.of("Recommendations based on recent mood check-ins."),
                "Stress coping tips are supportive and not clinical therapy."
        );
    }

    private int calculateMissedStreak(List<MedicationReminder> reminders) {
        int streak = 0;
        for (MedicationReminder reminder : reminders) {
            if (reminder.getStatus() == ReminderStatus.MISSED) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    private List<String> deriveCodes(String notes) {
        String lower = notes.toLowerCase();
        List<String> codes = new ArrayList<>();
        if (lower.contains("diabetes")) codes.add("E11");
        if (lower.contains("hypertension") || lower.contains("bp")) codes.add("I10");
        if (lower.contains("asthma")) codes.add("J45");
        if (codes.isEmpty()) codes.add("Z00");
        return codes;
    }

    private void ensurePatient(long patientId) {
        patientRepository.findById(patientId).orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
    }
}
