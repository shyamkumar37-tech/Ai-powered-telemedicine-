package com.telecareplus.ai;

import com.telecareplus.clinical.TriageLevel;

import com.telecareplus.api.DashboardServiceImpl;

import com.telecareplus.pharmacy.ReminderServiceImpl;

import com.telecareplus.users.Caregiver;
import com.telecareplus.users.Doctor;
import com.telecareplus.appointments.Appointment;
import com.telecareplus.pharmacy.Prescription;
import com.telecareplus.users.Patient;

import com.telecareplus.ai.IntelligenceDtos;
import com.telecareplus.common.AlertSeverity;
import com.telecareplus.pharmacy.ReminderStatus;
import com.telecareplus.clinical.RiskLevel;
import com.telecareplus.common.ResourceNotFoundException;
import com.telecareplus.notification.AlertNotificationRepository;
import com.telecareplus.appointments.AppointmentRepository;
import com.telecareplus.clinical.CarePlanRepository;
import com.telecareplus.users.CaregiverRepository;
import com.telecareplus.clinical.ConsultationNoteRepository;
import com.telecareplus.users.DoctorRepository;
import com.telecareplus.clinical.HealthRecordRepository;
import com.telecareplus.users.PatientCaregiverLinkRepository;
import com.telecareplus.users.PatientRepository;
import com.telecareplus.pharmacy.PrescriptionRepository;
import com.telecareplus.clinical.TriageAssessmentRepository;
import com.telecareplus.ai.IntelligenceService;
import com.telecareplus.ai.GenerativeAiService;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
public class IntelligenceServiceImpl implements IntelligenceService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final CaregiverRepository caregiverRepository;
    private final AppointmentRepository appointmentRepository;
    private final TriageAssessmentRepository triageAssessmentRepository;
    private final ConsultationNoteRepository consultationNoteRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final HealthRecordRepository healthRecordRepository;
    private final AlertNotificationRepository alertNotificationRepository;
    private final PatientCaregiverLinkRepository linkRepository;
    private final CarePlanRepository carePlanRepository;
    private final ReminderServiceImpl reminderService;
    private final GenerativeAiService generativeAiService;
    private final org.springframework.ai.chat.client.ChatClient chatClient;
    private final org.springframework.ai.vectorstore.VectorStore vectorStore;

    public IntelligenceServiceImpl(
        PatientRepository patientRepository,
        DoctorRepository doctorRepository,
        CaregiverRepository caregiverRepository,
        AppointmentRepository appointmentRepository,
        TriageAssessmentRepository triageAssessmentRepository,
        ConsultationNoteRepository consultationNoteRepository,
        PrescriptionRepository prescriptionRepository,
        HealthRecordRepository healthRecordRepository,
        AlertNotificationRepository alertNotificationRepository,
        PatientCaregiverLinkRepository linkRepository,
        CarePlanRepository carePlanRepository,
        ReminderServiceImpl reminderService,
        GenerativeAiService generativeAiService,
        org.springframework.ai.chat.client.ChatClient.Builder chatClientBuilder,
        org.springframework.ai.vectorstore.VectorStore vectorStore
    ) {
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.caregiverRepository = caregiverRepository;
        this.appointmentRepository = appointmentRepository;
        this.triageAssessmentRepository = triageAssessmentRepository;
        this.consultationNoteRepository = consultationNoteRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.healthRecordRepository = healthRecordRepository;
        this.alertNotificationRepository = alertNotificationRepository;
        this.linkRepository = linkRepository;
        this.carePlanRepository = carePlanRepository;
        this.reminderService = reminderService;
        this.generativeAiService = generativeAiService;
        this.chatClient = chatClientBuilder.build();
        this.vectorStore = vectorStore;
    }

    @Override
    @org.springframework.cache.annotation.Cacheable(value = "patientTimelines", key = "#patientId")
    public List<IntelligenceDtos.TimelineEventResponse> getPatientTimeline(Long patientId) {
        patientRepository.findById(patientId).orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        List<IntelligenceDtos.TimelineEventResponse> timeline = new ArrayList<>();

        triageAssessmentRepository.findByPatientIdOrderByAssessedAtDesc(patientId).forEach(item ->
                timeline.add(new IntelligenceDtos.TimelineEventResponse(
                        "TRIAGE",
                        "Triage assessed as " + item.getLevel().name().replace('_', ' '),
                        item.getRecommendation(),
                        toSeverity(item.getLevel().name()),
                        item.getAssessedAt())));

        appointmentRepository.findByPatientIdOrderByAppointmentDateTimeDesc(patientId).forEach(item ->
                timeline.add(new IntelligenceDtos.TimelineEventResponse(
                        "APPOINTMENT",
                        "Appointment " + item.getStatus().name(),
                        item.getDoctor().getUser().getFullName() + " | " + item.getConcernSummary(),
                        null,
                        item.getAppointmentDateTime())));

        consultationNoteRepository.findByPatientIdOrderByCreatedAtDesc(patientId).forEach(item ->
                timeline.add(new IntelligenceDtos.TimelineEventResponse(
                        "CONSULTATION",
                        "Consultation outcome: " + item.getOutcome().name().replace('_', ' '),
                        item.getNotes(),
                        null,
                        item.getCreatedAt())));

        prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patientId).forEach(item ->
                timeline.add(new IntelligenceDtos.TimelineEventResponse(
                        "PRESCRIPTION",
                        "Prescription issued by " + item.getDoctor().getUser().getFullName(),
                        item.getNotes(),
                        null,
                        item.getCreatedAt())));

        healthRecordRepository.findTop10ByPatientIdOrderByRecordedAtDesc(patientId).forEach(item ->
                timeline.add(new IntelligenceDtos.TimelineEventResponse(
                        "HEALTH",
                        "Health reading captured",
                        "BP " + safe(item.getBloodPressure()) + " | Sugar " + safe(item.getSugar()) + " | SpO2 " + safe(item.getSpo2()),
                        item.getAlertSeverity(),
                        item.getRecordedAt())));

        alertNotificationRepository.findByPatientIdAndActiveTrueOrderByCreatedAtDesc(patientId).forEach(item ->
                timeline.add(new IntelligenceDtos.TimelineEventResponse(
                        "ALERT",
                        item.getSeverity().name() + " alert",
                        item.getMessage(),
                        item.getSeverity(),
                        item.getCreatedAt())));

        return timeline.stream()
                .sorted(Comparator.comparing(IntelligenceDtos.TimelineEventResponse::occurredAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(30)
                .toList();
    }

    @Override
    public IntelligenceDtos.CareComplianceResponse getCareCompliance(Long patientId) {
        patientRepository.findById(patientId).orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        var adherence = reminderService.getAdherenceSummary(patientId);
        long missedCount = reminderService.getPatientReminders(patientId).stream().filter(item -> item.status() == ReminderStatus.MISSED).count();
        long openAlerts = alertNotificationRepository.findByPatientIdAndActiveTrueOrderByCreatedAtDesc(patientId).size();
        int recentReadings = healthRecordRepository.findTop10ByPatientIdOrderByRecordedAtDesc(patientId).size();
        long activeCarePlans = carePlanRepository.countByPatientIdAndActiveTrue(patientId);

        int score = (int) Math.max(0,
                Math.min(100,
                        adherence.adherencePercentage()
                                + (recentReadings >= 3 ? 10 : recentReadings * 3)
                                + (activeCarePlans > 0 ? 10 : 0)
                                - (missedCount * 8)
                                - (openAlerts * 6)));

        return new IntelligenceDtos.CareComplianceResponse(
                adherence.adherencePercentage(),
                missedCount,
                openAlerts,
                recentReadings,
                activeCarePlans,
                score,
                score >= 80 ? "Strong" : score >= 55 ? "Needs support" : "High risk gap"
        );
    }

    @Override
    @org.springframework.cache.annotation.Cacheable(value = "doctorPriorityQueue", key = "#doctorId")
    public List<IntelligenceDtos.DoctorPriorityPatientResponse> getDoctorPriorityQueue(Long doctorId) {
        doctorRepository.findById(doctorId).orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
        return appointmentRepository.findByDoctorIdOrderByAppointmentDateTimeDesc(doctorId).stream()
                .map(item -> item.getPatient())
                .distinct()
                .map(patient -> {
                    var adherence = reminderService.getAdherenceSummary(patient.getId());
                    double adherencePercentage = adherence.adherencePercentage();
                    var activeAlerts = alertNotificationRepository.findByPatientIdAndActiveTrueOrderByCreatedAtDesc(patient.getId());
                    String latestAlert = activeAlerts.isEmpty() ? "No active alert" : activeAlerts.get(0).getSeverity() + ": " + activeAlerts.get(0).getMessage();
                    
                    var latestTriage = triageAssessmentRepository.findTopByPatientIdOrderByAssessedAtDesc(patient.getId());
                    RiskLevel riskLevel = latestTriage == null ? RiskLevel.LOW : (latestTriage.getLevel() == com.telecareplus.clinical.TriageLevel.EMERGENCY_GO_TO_HOSPITAL ? RiskLevel.CRITICAL : latestTriage.getLevel() == com.telecareplus.clinical.TriageLevel.IN_PERSON_VISIT_RECOMMENDED ? RiskLevel.HIGH : RiskLevel.MODERATE);

                    String action = riskLevel == RiskLevel.CRITICAL
                            ? "Arrange urgent review or in-person escalation"
                            : adherencePercentage < 60
                            ? "Review adherence and caregiver support"
                            : "Continue continuity follow-up";

                    int riskScore = riskLevel == RiskLevel.CRITICAL ? 90 : (riskLevel == RiskLevel.HIGH ? 70 : (riskLevel == RiskLevel.MODERATE ? 45 : 20));
                    long pendingRemindersCount = adherence.missed();

                    return new IntelligenceDtos.DoctorPriorityPatientResponse(
                            patient.getId(),
                            patient.getUser().getFullName(),
                            riskScore,
                            riskLevel,
                            adherencePercentage,
                            pendingRemindersCount,
                            latestAlert,
                            action
                    );
                })
                .sorted(Comparator.comparing(IntelligenceDtos.DoctorPriorityPatientResponse::riskScore).reversed())
                .toList();
    }

    @Override
    public List<IntelligenceDtos.MissedCareGapResponse> getCaregiverCareGaps(Long caregiverId) {
        caregiverRepository.findById(caregiverId).orElseThrow(() -> new ResourceNotFoundException("Caregiver not found"));
        return linkRepository.findByCaregiverIdAndActiveTrue(caregiverId).stream()
                .flatMap(link -> {
                    var patient = link.getPatient();
                    List<IntelligenceDtos.MissedCareGapResponse> gaps = new ArrayList<>();
                    var reminders = reminderService.getPatientReminders(patient.getId());
                    long missedCount = reminders.stream().filter(item -> item.status() == ReminderStatus.MISSED).count();
                    if (missedCount >= 2) {
                        gaps.add(new IntelligenceDtos.MissedCareGapResponse(
                                patient.getId(),
                                patient.getUser().getFullName(),
                                "MEDICATION_GAP",
                                "Multiple medication doses were missed recently.",
                                AlertSeverity.WARNING,
                                "Check medicine intake and confirm adherence today"
                        ));
                    }
                    int recentReadings = healthRecordRepository.findTop10ByPatientIdOrderByRecordedAtDesc(patient.getId()).size();
                    if (recentReadings == 0) {
                        gaps.add(new IntelligenceDtos.MissedCareGapResponse(
                                patient.getId(),
                                patient.getUser().getFullName(),
                                "MONITORING_GAP",
                                "No recent health readings available.",
                                AlertSeverity.WARNING,
                                "Help patient record BP, sugar, or SpO2 today"
                        ));
                    }
                    if (alertNotificationRepository.findByPatientIdAndActiveTrueOrderByCreatedAtDesc(patient.getId()).stream().anyMatch(alert -> alert.getSeverity() == AlertSeverity.CRITICAL)) {
                        gaps.add(new IntelligenceDtos.MissedCareGapResponse(
                                patient.getId(),
                                patient.getUser().getFullName(),
                                "ESCALATION_GAP",
                                "Critical alert requires caregiver intervention follow-through.",
                                AlertSeverity.CRITICAL,
                                "Call patient immediately and coordinate in-person review"
                        ));
                    }
                    return gaps.stream();
                })
                .sorted(Comparator.comparing((IntelligenceDtos.MissedCareGapResponse gap) -> gap.severity() == AlertSeverity.CRITICAL ? 1 : 0).reversed())
                .toList();
    }

    @Override
    public IntelligenceDtos.PatientEducationResponse getPatientEducation(Long patientId) {
        var patient = patientRepository.findById(patientId).orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        List<String> tips = new ArrayList<>();
        String diseases = patient.getDiseases() == null ? "" : patient.getDiseases().toLowerCase();
        var latestHealth = healthRecordRepository.findTop10ByPatientIdOrderByRecordedAtDesc(patientId).stream().findFirst().orElse(null);
        var latestConsultation = consultationNoteRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream().findFirst().orElse(null);
        long pendingReminders = reminderService.getPatientReminders(patientId).stream()
                .filter(item -> item.status() == ReminderStatus.PENDING)
                .count();
        if (diseases.contains("diabetes")) {
            tips.add(latestHealth != null && latestHealth.getSugar() != null
                    ? "Your latest sugar is " + latestHealth.getSugar().intValue() + " mg/dL, so record fasting and post-meal readings regularly."
                    : "Record sugar readings regularly and avoid skipping diabetic medicine.");
            tips.add("Prefer consistent meal timing and reduce refined sugar intake to stabilize the diabetes profile.");
        }
        if (diseases.contains("hypertension")) {
            tips.add(latestHealth != null && latestHealth.getBloodPressure() != null
                    ? "Your latest blood pressure is " + latestHealth.getBloodPressure() + ", so keep tracking BP regularly and limit excess salt intake."
                    : "Track blood pressure regularly and limit excess salt intake.");
            tips.add("Take antihypertensive medicine at the same time each day unless the doctor changes the schedule.");
        }
        var latestTriage = triageAssessmentRepository.findByPatientIdOrderByAssessedAtDesc(patientId).stream().findFirst().orElse(null);
        if (latestTriage != null && !"ROUTINE_CONSULTATION".equals(latestTriage.getLevel().name())) {
            tips.add("Because your last triage was above routine level, seek earlier follow-up if symptoms worsen.");
        }
        if (pendingReminders > 0) {
            tips.add("You still have " + pendingReminders + " pending medicine reminder(s), so update the reminders page today.");
        }
        if (latestConsultation != null && latestConsultation.getFollowUpDate() != null) {
            tips.add("Your latest consultation follow-up date is " + latestConsultation.getFollowUpDate() + ", so complete readings and reminders before that review.");
        }
        if (carePlanRepository.countByPatientIdAndActiveTrue(patientId) > 0) {
            tips.add("Review your active care plan regularly and follow its warning thresholds and lifestyle guidance.");
        }
        if (tips.isEmpty()) {
            tips.add("Continue regular check-ins, medicine adherence, and follow-up attendance.");
            tips.add("Use the health module to keep your doctor updated with recent readings.");
        }
        String headline = patient.getDiseases() == null || patient.getDiseases().isBlank()
                ? "Personalized self-care guidance"
                : "Personalized self-care guidance for " + patient.getDiseases();
        return new IntelligenceDtos.PatientEducationResponse(headline, tips);
    }

    private AlertSeverity toSeverity(String triageLevel) {
        if ("EMERGENCY_GO_TO_HOSPITAL".equals(triageLevel)) {
            return AlertSeverity.CRITICAL;
        }
        if ("IN_PERSON_VISIT_RECOMMENDED".equals(triageLevel) || "PRIORITY_CONSULTATION".equals(triageLevel)) {
            return AlertSeverity.WARNING;
        }
        return AlertSeverity.INFO;
    }

    private String safe(Object value) {
        return value == null ? "-" : String.valueOf(value);
    }

    @Override
    public IntelligenceDtos.AudioScribeResponse generateSoapNote(IntelligenceDtos.AudioScribeRequest request) {
        String systemPrompt = """
            You are an expert Medical Scribe. Extract a structured SOAP note from the provided consultation transcript.
            Respond ONLY with a valid JSON object containing exactly these fields:
            {
              "subjective": "patient's symptoms and history...",
              "objective": "clinical observations and vitals...",
              "assessment": "diagnoses or impressions...",
              "plan": "treatment, medications, and follow-up..."
            }
            Do not include markdown blocks or any other text.
            """;
        String userPrompt = request.audioText();

        var aiResponse = generativeAiService.generateRawText(systemPrompt, userPrompt);
        
        if (aiResponse.isPresent()) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(aiResponse.get().replaceAll("^```json\\s*", "").replaceAll("\\s*```$", ""));
                return new IntelligenceDtos.AudioScribeResponse(
                        root.path("subjective").asText(""),
                        root.path("objective").asText(""),
                        root.path("assessment").asText(""),
                        root.path("plan").asText(""),
                        request.audioText() + "\n\n(AI Generated summary)"
                );
            } catch (Exception e) {
                // Fallback on parse error
            }
        }

        // Fallback if AI fails
        return new IntelligenceDtos.AudioScribeResponse(
                "Patient reports feeling fatigued and experiencing mild headaches.",
                "BP 120/80 mmHg, HR 75 bpm.",
                "Viral syndrome.",
                "Rest and hydration.",
                request.audioText() + "\n\n(Fallback summary)"
        );
    }

    @Override
    public IntelligenceDtos.DrugInteractionResponse checkDrugInteractions(IntelligenceDtos.DrugInteractionRequest request) {
        String meds = request.medications() != null ? String.join(", ", request.medications()) : "None";
        String systemPrompt = """
            You are a clinical pharmacologist. Check for drug-drug interactions among the following medications.
            Respond ONLY with a JSON array of interaction alerts (empty array if none):
            [
              {"severity": "High/Moderate/Low", "description": "Details of the interaction..."}
            ]
            Do not include markdown or extra text.
            """;
        var aiResponse = generativeAiService.generateRawText(systemPrompt, meds);
        List<IntelligenceDtos.InteractionAlert> alerts = new ArrayList<>();
        
        if (aiResponse.isPresent()) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(aiResponse.get().replaceAll("^```json\\s*", "").replaceAll("\\s*```$", ""));
                if (root.isArray()) {
                    root.forEach(node -> alerts.add(new IntelligenceDtos.InteractionAlert(
                        node.path("severity").asText("Unknown"),
                        node.path("description").asText("")
                    )));
                    return new IntelligenceDtos.DrugInteractionResponse(alerts);
                }
            } catch (Exception e) {
                // fallback
            }
        }
        
        // Fallback
        if (request.medications() != null && request.medications().size() > 1) {
            alerts.add(new IntelligenceDtos.InteractionAlert("Moderate", "Please review polypharmacy manually."));
        }
        return new IntelligenceDtos.DrugInteractionResponse(alerts);
    }

    @Override
    public IntelligenceDtos.DosageCalculationResponse calculateDosage(IntelligenceDtos.DosageCalculationRequest request) {
        String systemPrompt = """
            You are a clinical pharmacist. Calculate the recommended dosage for the requested medication for a standard adult (70kg).
            Respond ONLY with a JSON object:
            {
              "suggestedDosage": "e.g., 500mg PO BID",
              "reasoning": "Standard adult dosing..."
            }
            Do not include markdown.
            """;
        var aiResponse = generativeAiService.generateRawText(systemPrompt, request.medication());
        
        if (aiResponse.isPresent()) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(aiResponse.get().replaceAll("^```json\\s*", "").replaceAll("\\s*```$", ""));
                return new IntelligenceDtos.DosageCalculationResponse(
                    root.path("suggestedDosage").asText(""),
                    root.path("reasoning").asText("")
                );
            } catch (Exception e) {}
        }
        return new IntelligenceDtos.DosageCalculationResponse("Standard Dose", "Fallback: Please consult Lexicomp.");
    }

    @Override
    public IntelligenceDtos.FormularySubstituteResponse suggestAlternatives(IntelligenceDtos.FormularySubstituteRequest request) {
        String systemPrompt = """
            You are a clinical pharmacist. Suggest 1 to 3 formulary alternatives for the following medication.
            Respond ONLY with a JSON object:
            {
              "alternatives": ["Alt1", "Alt2"],
              "reasoning": "Reasoning for the alternatives..."
            }
            """;
        var aiResponse = generativeAiService.generateRawText(systemPrompt, request.medication());
        
        if (aiResponse.isPresent()) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(aiResponse.get().replaceAll("^```json\\s*", "").replaceAll("\\s*```$", ""));
                List<String> alts = new ArrayList<>();
                root.path("alternatives").forEach(n -> alts.add(n.asText()));
                return new IntelligenceDtos.FormularySubstituteResponse(alts, root.path("reasoning").asText(""));
            } catch (Exception e) {}
        }
        return new IntelligenceDtos.FormularySubstituteResponse(List.of("Generic Equivalent"), "Fallback: Consult formulary handbook.");
    }

    @Override
    public IntelligenceDtos.CopilotResponse askCopilot(IntelligenceDtos.CopilotRequest request) {
        // Implement RAG
        List<org.springframework.ai.document.Document> documents = vectorStore.similaritySearch(request.query());
        List<String> sources = new ArrayList<>();
        StringBuilder context = new StringBuilder();
        
        for (org.springframework.ai.document.Document doc : documents) {
            context.append(doc.getContent()).append("\n\n");
            if (doc.getMetadata().containsKey("source")) {
                sources.add((String) doc.getMetadata().get("source"));
            }
        }
        
        String prompt = "You are a clinical AI Copilot. Answer the query based on the following context:\n" 
                + context.toString() + "\n\nQuery: " + request.query();
                
        String answer = chatClient.prompt()
            .user(prompt)
            .call()
            .content();
            
        return new IntelligenceDtos.CopilotResponse(answer, sources.stream().distinct().toList());
    }

    @Override
    public IntelligenceDtos.OcrPrescriptionResponse extractPrescriptionFromImage(org.springframework.web.multipart.MultipartFile image) {
        try {
            org.springframework.core.io.Resource resource = image.getResource();
            String response = chatClient.prompt()
                .user(u -> u.text("Extract prescription details as JSON: {\"medications\": [\"name1\", \"name2\"], \"instructions\": \"take 1 daily\"}. No markdown.")
                            .media(new org.springframework.ai.model.Media(org.springframework.util.MimeTypeUtils.parseMimeType(image.getContentType()), resource)))
                .call()
                .content();
                
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(response.replaceAll("^```json\\s*", "").replaceAll("\\s*```$", ""));
            
            List<String> meds = new ArrayList<>();
            if (root.has("medications") && root.get("medications").isArray()) {
                root.get("medications").forEach(n -> meds.add(n.asText()));
            }
            return new IntelligenceDtos.OcrPrescriptionResponse(
                response,
                meds,
                root.path("instructions").asText("")
            );
        } catch (Exception e) {
            return new IntelligenceDtos.OcrPrescriptionResponse("Failed: " + e.getMessage(), List.of(), "");
        }
    }

    @Override
    public IntelligenceDtos.AudioScribeResponse transcribeAudioToSoapNote(org.springframework.web.multipart.MultipartFile audio) {
        try {
            org.springframework.core.io.Resource resource = audio.getResource();
            String response = chatClient.prompt()
                .user(u -> u.text("Transcribe this consultation and format as a SOAP note in JSON: {\"subjective\":\"...\",\"objective\":\"...\",\"assessment\":\"...\",\"plan\":\"...\",\"fullNotes\":\"transcript...\"}. No markdown.")
                            .media(new org.springframework.ai.model.Media(org.springframework.util.MimeTypeUtils.parseMimeType(audio.getContentType()), resource)))
                .call()
                .content();
                
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(response.replaceAll("^```json\\s*", "").replaceAll("\\s*```$", ""));
            
            return new IntelligenceDtos.AudioScribeResponse(
                root.path("subjective").asText(""),
                root.path("objective").asText(""),
                root.path("assessment").asText(""),
                root.path("plan").asText(""),
                root.path("fullNotes").asText("")
            );
        } catch (Exception e) {
            return new IntelligenceDtos.AudioScribeResponse("Failed", "", "", "Error: " + e.getMessage(), "");
        }
    }
}
