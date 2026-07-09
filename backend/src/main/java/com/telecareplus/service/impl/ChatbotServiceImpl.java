package com.telecareplus.service.impl;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.telecareplus.dto.ChatbotDtos;
import com.telecareplus.entity.AlertNotification;
import com.telecareplus.entity.ConsultationNote;
import com.telecareplus.entity.HealthRecord;
import com.telecareplus.entity.MedicationItem;
import com.telecareplus.entity.Patient;
import com.telecareplus.entity.PatientChatMessage;
import com.telecareplus.entity.TriageAssessment;
import com.telecareplus.entity.enums.ReminderStatus;
import com.telecareplus.exception.ResourceNotFoundException;
import com.telecareplus.repository.AlertNotificationRepository;
import com.telecareplus.repository.AppointmentRepository;
import com.telecareplus.repository.ConsultationNoteRepository;
import com.telecareplus.repository.HealthRecordRepository;
import com.telecareplus.repository.MedicationItemRepository;
import com.telecareplus.repository.MedicationReminderRepository;
import com.telecareplus.repository.PatientChatMessageRepository;
import com.telecareplus.repository.PatientRepository;
import com.telecareplus.repository.PrescriptionRepository;
import com.telecareplus.repository.TriageAssessmentRepository;
import com.telecareplus.service.ChatbotService;
import com.telecareplus.service.GenerativeAiService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChatbotServiceImpl implements ChatbotService {

    private final PatientRepository patientRepository;
    private final PatientChatMessageRepository patientChatMessageRepository;
    private final TriageAssessmentRepository triageAssessmentRepository;
    private final HealthRecordRepository healthRecordRepository;
    private final MedicationReminderRepository medicationReminderRepository;
    private final AlertNotificationRepository alertNotificationRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicationItemRepository medicationItemRepository;
    private final ConsultationNoteRepository consultationNoteRepository;
    private final AppointmentRepository appointmentRepository;
    private final GenerativeAiService generativeAiService;

    @Override
    public List<ChatbotDtos.ChatResponse> getHistory(Long patientId) {
        return patientChatMessageRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public ChatbotDtos.ChatResponse ask(ChatbotDtos.ChatRequest request) {
        Patient patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        String question = request.question().trim();
        String lower = question.toLowerCase();
        List<PatientChatMessage> recentConversation = patientChatMessageRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId()).stream()
                .limit(6)
                .toList();
        String answer;
        String urgency;
        List<String> actions = new ArrayList<>();
        String diseases = Optional.ofNullable(patient.getDiseases()).orElse("").toLowerCase(Locale.ROOT);
        HealthRecord latestHealth = healthRecordRepository.findTop10ByPatientIdOrderByRecordedAtDesc(patient.getId()).stream()
                .findFirst()
                .orElse(null);
        ConsultationNote latestConsultation = consultationNoteRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId()).stream()
                .findFirst()
                .orElse(null);
        String latestConsultationNote = latestConsultation == null ? "" : summarizeClinicalNote(latestConsultation.getNotes());
        TriageAssessment latestTriageAssessment = triageAssessmentRepository.findByPatientIdOrderByAssessedAtDesc(patient.getId()).stream()
                .findFirst()
                .orElse(null);
        String latestTriage = latestTriageAssessment == null
                ? "No recent triage recommendation recorded."
                : latestTriageAssessment.getRecommendation();
        List<MedicationItem> recentMedicationItems = recentMedicationItems(patient.getId());
        List<MedicationItem> diabetesMedicines = filterMedicines(recentMedicationItems, "metformin", "insulin", "glimepiride", "gliclazide", "sitagliptin");
        List<MedicationItem> bloodPressureMedicines = filterMedicines(recentMedicationItems, "amlodipine", "telmisartan", "losartan", "atenolol", "metoprolol", "olmesartan");
        List<MedicationItem> respiratoryMedicines = filterMedicines(recentMedicationItems, "salbutamol", "budesonide", "levocetirizine", "cetirizine", "montelukast");
        List<MedicationItem> feverOrInfectionMedicines = filterMedicines(recentMedicationItems, "paracetamol", "acetaminophen", "ibuprofen", "amoxicillin", "azithromycin", "doxycycline");
        List<MedicationItem> digestiveMedicines = filterMedicines(recentMedicationItems, "pantoprazole", "omeprazole", "rabeprazole", "ondansetron", "domperidone", "ors");
        List<MedicationItem> matchingMedicines = medicationsMentionedInQuestion(recentMedicationItems, lower);
        List<AlertNotification> activeAlerts = alertNotificationRepository.findByPatientIdAndActiveTrueOrderByCreatedAtDesc(patient.getId());

        boolean hasCriticalAlert = activeAlerts.stream()
                .findFirst()
                .map(alert -> alert.getSeverity().name().contains("CRITICAL"))
                .orElse(false);
        double latestSugar = latestHealth == null || latestHealth.getSugar() == null ? 0.0 : latestHealth.getSugar();
        Double latestSpo2 = latestHealth == null ? null : latestHealth.getSpo2();
        Double latestPulse = latestHealth == null ? null : latestHealth.getPulse();
        Double latestTemperature = latestHealth == null ? null : latestHealth.getTemperature();
        String latestBloodPressure = latestHealth == null ? null : latestHealth.getBloodPressure();
        long pendingReminders = medicationReminderRepository.countByPatientIdAndStatus(patient.getId(), ReminderStatus.PENDING);
        boolean diabetesProfile = containsAny(diseases, "diabetes", "sugar");
        boolean hypertensionProfile = containsAny(diseases, "hypertension", "blood pressure", "bp");
        boolean respiratoryProfile = containsAny(diseases, "asthma", "copd", "breath", "respiratory");
        boolean asksDiabetes = containsAny(lower, "sugar", "diabetes", "glucose", "fasting", "post meal");
        boolean asksBloodPressure = containsAny(lower, "bp", "blood pressure", "hypertension", "pressure", "dizzy", "vision");
        boolean asksRespiratory = containsAny(lower, "breath", "breathing", "spo2", "oxygen", "cough", "asthma", "wheeze");
        boolean asksFeverOrInfection = containsAny(lower, "fever", "temperature", "cold", "infection", "throat", "body pain");
        boolean asksDigestive = containsAny(lower, "stomach", "vomit", "vomiting", "nausea", "loose motion", "diarrhea", "diarrhoea", "acidity", "gastric", "gas");
        boolean asksMedication = containsAny(lower, "medicine", "medication", "tablet", "dose", "prescription", "drug");
        boolean asksAppointment = containsAny(lower, "appointment", "doctor", "review", "visit", "follow up", "follow-up", "book");
        boolean asksReminder = containsAny(lower, "reminder", "missed", "adherence", "taken");
        boolean greetingOnly = containsAny(lower, "hi", "hello", "how are you", "good morning", "good evening") && lower.split("\\s+").length <= 5;
        boolean asksGeneralSymptoms = containsAny(lower, "headache", "tired", "fatigue", "weakness", "body ache", "aches");
        boolean emergencyQuestion = containsAny(lower, "chest pain", "severe breath", "faint", "fainting", "unconscious", "collapse");

        if (generativeAiService.isConfigured()) {
            String systemPrompt = "You are the TeleCare+ AI Assistant, an empathetic and highly knowledgeable clinical chatbot. "
                    + "Your purpose is to answer the patient's question safely using their clinical context. "
                    + "Do NOT prescribe new medications. Advise in-person emergency care for CRITICAL symptoms. "
                    + "Context:\n"
                    + "- Diseases: " + (diseases.isBlank() ? "None" : diseases) + "\n"
                    + "- Latest Triage: " + latestTriage + "\n"
                    + "- Latest Vitals: Temp " + latestTemperature + ", BP " + latestBloodPressure + ", SpO2 " + latestSpo2 + "\n"
                    + "- Active Alerts: " + activeAlerts.size() + "\n"
                    + "- Recent Medicines: " + summarizeMedicines(recentMedicationItems) + "\n"
                    + "Respond in JSON format containing 'answer' (string), 'urgencyLabel' (INFO, ROUTINE, WARNING, or CRITICAL), and 'suggestedActions' (array of strings).";

            Optional<GenerativeAiService.GeneratedReply> aiReply = generativeAiService.generateClinicalReply(systemPrompt, question);
            if (aiReply.isPresent()) {
                GenerativeAiService.GeneratedReply reply = aiReply.get();
                PatientChatMessage msg = new PatientChatMessage();
                msg.setPatient(patient);
                msg.setQuestion(question);
                msg.setAnswer(reply.answer());
                msg.setUrgencyLabel(reply.urgencyLabel());
                msg.setSuggestedActions(String.join("|", reply.suggestedActions()));
                patientChatMessageRepository.save(msg);

                return new ChatbotDtos.ChatResponse(
                        msg.getId(),
                        msg.getQuestion(),
                        msg.getAnswer(),
                        msg.getUrgencyLabel(),
                        reply.suggestedActions(),
                        msg.getCreatedAt() != null ? msg.getCreatedAt() : java.time.LocalDateTime.now()
                );
            }
        }

        if (emergencyQuestion) {
            urgency = "CRITICAL";
            answer = "I checked your question against the latest TeleCare+ record, and these symptoms sound high risk. Do not wait for a routine teleconsult. Seek immediate in-person medical attention and inform your caregiver now.";
            actions.addAll(Arrays.asList(
                    "Seek in-person emergency care immediately.",
                    "Do not delay with home monitoring alone.",
                    "Ask your caregiver to support transport and doctor communication."
            ));
        } else if (asksFeverOrInfection) {
            urgency = latestTemperature != null && latestTemperature >= 101 ? "WARNING" : "ROUTINE";
            String feverSummary = latestTemperature == null
                    ? "I do not see a recent temperature entry in your record."
                    : "Your latest temperature is " + formatNumber(latestTemperature) + " F.";
            String medicineSummary = feverOrInfectionMedicines.isEmpty()
                    ? "I do not see a recent fever or infection prescription in your record."
                    : "Your recent prescribed medicines for pain, fever, or infection include " + summarizeMedicines(feverOrInfectionMedicines) + ".";
            answer = "I checked your latest fever and infection-related record. " + feverSummary + " " + medicineSummary + " Continue only doctor-prescribed medicines, rest, and hydration. "
                    + (latestTemperature != null && latestTemperature >= 101
                    ? "Because the temperature is still high, book an earlier review if it stays persistent."
                    : "If fever persists, breathing changes, or weakness increases, request doctor review.");
            actions.addAll(Arrays.asList(
                    "Track temperature again in a few hours if fever continues.",
                    "Use only the medicines already prescribed for fever or infection.",
                    "Book review if fever persists or new red-flag symptoms appear."
            ));
        } else if (asksBloodPressure) {
            urgency = isCriticalBloodPressure(latestBloodPressure) || hasCriticalAlert ? "WARNING" : "ROUTINE";
            String bpSummary = latestBloodPressure == null || latestBloodPressure.isBlank()
                    ? "I do not see a recent blood pressure entry in your record."
                    : "Your latest blood pressure is " + latestBloodPressure + ".";
            String medicineSummary = bloodPressureMedicines.isEmpty()
                    ? "I do not see a recent blood-pressure prescription on record, so do not add any new tablet without doctor advice."
                    : "Your blood-pressure medicines on record include " + summarizeMedicines(bloodPressureMedicines) + ".";
            answer = "I checked your latest blood-pressure continuity record. " + bpSummary + " " + medicineSummary + " "
                    + (isCriticalBloodPressure(latestBloodPressure)
                    ? "Because the latest reading is high-risk, you should not delay doctor review."
                    : "Keep monitoring at the same time each day and watch for headache, dizziness, or blurred vision.");
            actions.addAll(Arrays.asList(
                    "Log a fresh BP reading today if you have not done so already.",
                    "Take only the blood-pressure medicines already prescribed to you.",
                    "Seek earlier review if BP stays very high or symptoms worsen."
            ));
        } else if (asksRespiratory) {
            urgency = latestSpo2 != null && latestSpo2 < 94 ? "WARNING" : hasCriticalAlert ? "WARNING" : "ROUTINE";
            String spo2Summary = latestSpo2 == null
                    ? "I do not see a recent oxygen reading in your record."
                    : "Your latest SpO2 reading is " + formatNumber(latestSpo2) + "%.";
            String medicineSummary = respiratoryMedicines.isEmpty()
                    ? "I do not see a recent breathing-specific prescription on file."
                    : "The breathing or allergy medicines I can confirm on record include " + summarizeMedicines(respiratoryMedicines) + ".";
            answer = "I checked your latest breathing-related record. " + spo2Summary + " " + medicineSummary + " "
                    + (latestSpo2 != null && latestSpo2 < 94
                    ? "That oxygen level needs faster clinical review and should not be handled as a routine concern."
                    : "Monitor cough, wheeze, or breathlessness closely and update the doctor if symptoms increase.");
            actions.addAll(Arrays.asList(
                    "Record a fresh SpO2 reading if you feel breathless or have cough.",
                    "Use only your prescribed respiratory medicines or inhalers.",
                    "Seek in-person review if breathing worsens, oxygen falls, or chest discomfort appears."
            ));
        } else if (asksDigestive) {
            urgency = hasCriticalAlert ? "WARNING" : "ROUTINE";
            String medicineSummary = digestiveMedicines.isEmpty()
                    ? "I do not see a recent stomach- or nausea-related prescription in your record."
                    : "Recent stomach-related medicines on your record include " + summarizeMedicines(digestiveMedicines) + ".";
            answer = "I checked your digestive-symptom record. " + medicineSummary + " Keep hydration, light meals, and symptom tracking going. "
                    + recentNoteContext(latestConsultationNote)
                    + " If vomiting, dehydration, or worsening weakness continues, book an earlier review.";
            actions.addAll(Arrays.asList(
                    "Take only the stomach or nausea medicines already prescribed to you.",
                    "Log any dehydration, vomiting, or loose-motion pattern in your notes.",
                    "Request review sooner if you cannot keep fluids down or symptoms intensify."
            ));
        } else if (asksDiabetes) {
            urgency = latestSugar >= 250 || hasCriticalAlert ? "WARNING" : "ROUTINE";
            String sugarSummary = latestSugar > 0
                    ? "Your latest recorded sugar is " + formatNumber(latestSugar) + " mg/dL."
                    : "I do not see a recent sugar reading in your record.";
            String medicineSummary = diabetesMedicines.isEmpty()
                    ? "I do not see a recent diabetes-specific prescription in your record, so do not start any new medicine without doctor review."
                    : "Your diabetes-related medicines on record include " + summarizeMedicines(diabetesMedicines) + ". Use only the medicines already prescribed to you.";
            answer = "I checked your latest diabetes continuity record. " + sugarSummary + " " + medicineSummary + " "
                    + (latestSugar >= 250
                    ? "This level is above the safe continuity target and needs an earlier doctor review."
                    : "Keep fasting and post-meal readings regular so the doctor can review the trend properly.");
            actions.addAll(Arrays.asList(
                    "Record your latest fasting and post-meal sugar values.",
                    "Continue only your prescribed diabetes medicines and hydration plan.",
                    "Book a follow-up if dizziness, weakness, or persistent high sugar continues."
            ));
        } else if (asksMedication) {
            urgency = pendingReminders > 2 ? "WARNING" : "ROUTINE";
            String medicineSummary = !matchingMedicines.isEmpty()
                    ? "The medicines matching your question are " + summarizeMedicines(matchingMedicines) + "."
                    : recentMedicationItems.isEmpty()
                    ? "I do not see a recent prescription on your record."
                    : "Your most recent prescribed medicines include " + summarizeMedicines(recentMedicationItems) + ".";
            answer = "I checked your latest prescription and reminder record. " + medicineSummary + " " + (pendingReminders > 2
                    ? "You also have multiple pending medicine reminders, so adherence needs attention before the next consultation."
                    : "Continue only those prescribed medicines and use the reminders page to stay on schedule.")
                    + " " + recentNoteContext(latestConsultationNote);
            actions.addAll(Arrays.asList(
                    "Check the reminders page for pending doses.",
                    "Mark medicines taken or missed honestly.",
                    "Ask your caregiver for support if reminders are being missed."
            ));
        } else if (asksReminder) {
            urgency = pendingReminders > 2 ? "WARNING" : "ROUTINE";
            answer = pendingReminders > 0
                    ? "I checked your reminder history and you currently have " + pendingReminders + " pending medication reminders. Use the reminders page to mark them correctly so your continuity record stays accurate."
                    : "I checked your reminder history and it looks up to date right now. Keep marking medicines taken or missed honestly.";
            actions.addAll(Arrays.asList(
                    "Open the reminders page and clear pending doses.",
                    "Ask a caregiver to help if reminders are repeatedly missed.",
                    "Tell the doctor if the schedule is too difficult to follow."
            ));
        } else if (asksAppointment) {
            urgency = hasCriticalAlert ? "WARNING" : "ROUTINE";
            answer = hasCriticalAlert
                    ? "Because you have an active critical alert, request an urgent in-person review instead of a routine follow-up."
                    : "You can use TeleCare+ booking or IVR booking to schedule your next continuity review. Latest triage guidance: " + latestTriage;
            actions.addAll(Arrays.asList(
                    "Choose the booking page or IVR booking assistant.",
                    "Keep your latest triage and health readings updated.",
                    "Mention your main concern summary clearly."
            ));
        } else if (greetingOnly) {
            urgency = "ROUTINE";
            answer = "Hello. I have your latest TeleCare+ continuity record in view, including medicines, health readings, triage, and follow-up notes. Ask me about symptoms, sugar, blood pressure, breathing, medicines, reminders, or review planning and I will answer from your record. If you are feeling worse or have urgent symptoms, please seek in-person care.";
            actions.addAll(Arrays.asList(
                    "Ask about diabetes, BP, breathing, fever, medicines, reminders, or appointments.",
                    "Keep recent health readings updated for better guidance.",
                    "Use voice assist if typing is difficult."
            ));
        } else if (asksGeneralSymptoms) {
            urgency = hasCriticalAlert ? "WARNING" : "ROUTINE";
            answer = "I can help with general symptom guidance based on your continuity record. Share whether the symptoms are new, how long they have lasted, and any accompanying fever, breathing changes, or dizziness so I can be more specific. "
                    + recentNoteContext(latestConsultationNote);
            actions.addAll(Arrays.asList(
                    "Track symptom timing and severity today.",
                    "Note any fever, breathing changes, or dizziness.",
                    "Book a review if symptoms persist or worsen."
            ));
        } else if (diabetesProfile) {
            urgency = latestSugar >= 250 || hasCriticalAlert ? "WARNING" : "ROUTINE";
            answer = "Because your continuity profile includes diabetes, I checked your recent sugar and medicine record before answering. Keep sugar readings and medicine adherence updated before the next review. "
                    + (diabetesMedicines.isEmpty()
                    ? "I do not see a current diabetes-specific prescription on file."
                    : "Recent diabetes medicines on your record include " + summarizeMedicines(diabetesMedicines) + ".")
                    + " " + recentNoteContext(latestConsultationNote);
            actions.addAll(Arrays.asList(
                    "Record a fresh fasting or post-meal sugar reading.",
                    "Review your reminders for diabetes medicines.",
                    "Use the chatbot again with a symptom-specific question for more targeted guidance."
            ));
        } else if (hypertensionProfile) {
            urgency = isCriticalBloodPressure(latestBloodPressure) || hasCriticalAlert ? "WARNING" : "ROUTINE";
            answer = "Because your continuity profile includes blood-pressure care, I checked your BP and medicine record before answering. Keep BP readings regular and stay on your prescribed medicines. "
                    + (bloodPressureMedicines.isEmpty()
                    ? "I do not see a recent blood-pressure prescription on file."
                    : "Recent blood-pressure medicines include " + summarizeMedicines(bloodPressureMedicines) + ".")
                    + " " + recentNoteContext(latestConsultationNote);
            actions.addAll(Arrays.asList(
                    "Log a fresh BP reading.",
                    "Do not skip blood-pressure medicines already prescribed to you.",
                    "Book review sooner if headaches, dizziness, or blurred vision continue."
            ));
        } else if (respiratoryProfile) {
            urgency = latestSpo2 != null && latestSpo2 < 94 ? "WARNING" : hasCriticalAlert ? "WARNING" : "ROUTINE";
            answer = "Because your continuity profile includes respiratory monitoring, I checked your breathing-related readings and prescriptions before answering. Keep cough, breathlessness, and oxygen readings updated. "
                    + (respiratoryMedicines.isEmpty()
                    ? "I do not see a recent respiratory prescription on file."
                    : "Recent respiratory medicines include " + summarizeMedicines(respiratoryMedicines) + ".")
                    + " " + recentNoteContext(latestConsultationNote);
            actions.addAll(Arrays.asList(
                    "Record a fresh SpO2 reading if symptoms are active.",
                    "Use only prescribed inhalers or respiratory medicines.",
                    "Seek earlier review if breathing worsens."
            ));
        } else {
            urgency = hasCriticalAlert ? "WARNING" : "ROUTINE";
            String conditionSummary = diseases.isBlank()
                    ? "your continuity profile"
                    : "your " + diseases + " continuity profile";
            String medicineSummary = recentMedicationItems.isEmpty()
                    ? "I do not see a recent prescription on file."
                    : "Recent prescribed medicines include " + summarizeMedicines(recentMedicationItems) + ".";
            answer = "I checked " + conditionSummary + " before answering. Stay consistent with medicines, health readings, and follow-up plans. "
                    + medicineSummary + " Latest triage guidance: " + latestTriage + ". " + recentNoteContext(latestConsultationNote);
            actions.addAll(Arrays.asList(
                    "Track fresh BP, sugar, or SpO2 readings.",
                    "Review your latest reminders and care plan.",
                    "Use doctor messaging if your symptoms are changing."
            ));
        }

        var generatedReply = generativeAiService.generateClinicalReply(
                chatbotSystemPrompt(),
                buildChatbotPrompt(
                        patient,
                        question,
                        recentConversation,
                        latestTriageAssessment,
                        latestConsultation,
                        latestHealth,
                        activeAlerts,
                        recentMedicationItems,
                        pendingReminders,
                        answer,
                        urgency,
                        actions
                ));
        if (generatedReply.isPresent()) {
            answer = generatedReply.get().answer();
            urgency = generatedReply.get().urgencyLabel();
            if (!generatedReply.get().suggestedActions().isEmpty()) {
                actions = new ArrayList<>(generatedReply.get().suggestedActions());
            }
        }

        PatientChatMessage chatMessage = new PatientChatMessage();
        chatMessage.setPatient(patient);
        chatMessage.setQuestion(question);
        chatMessage.setAnswer(answer);
        chatMessage.setUrgencyLabel(urgency);
        chatMessage.setSuggestedActions(String.join("||", actions));
        return toResponse(patientChatMessageRepository.save(chatMessage));
    }

    private String chatbotSystemPrompt() {
        return """
                You are TeleCare+, a careful clinical continuity assistant for telemedicine follow-up.
                Use only the supplied patient record and recent chat context.
                Never invent diagnoses, medicines, lab values, or appointments.
                Do not prescribe any new medicine that is not already present in the supplied record.
                Do not present your answer as a confirmed diagnosis, emergency clearance, or clinically certified decision support.
                Keep the wording honest: this is continuity-care guidance that supports, but does not replace, clinician assessment.
                If the record shows emergency or severe red flags, set urgency to CRITICAL and clearly advise urgent in-person care.
                Otherwise use WARNING for same-day or early review concerns, and ROUTINE for normal follow-up guidance.
                Keep the answer specific, calm, and conversational, like a high-quality care assistant.
                Return valid JSON only in this format:
                {"urgency":"ROUTINE","answer":"...","suggestedActions":["...","...","..."]}
                Keep suggestedActions to 2-4 short items.
                """;
    }

    private String buildChatbotPrompt(
            Patient patient,
            String question,
            List<PatientChatMessage> recentConversation,
            TriageAssessment latestTriageAssessment,
            ConsultationNote latestConsultation,
            HealthRecord latestHealth,
            List<AlertNotification> activeAlerts,
            List<MedicationItem> recentMedicationItems,
            long pendingReminders,
            String fallbackAnswer,
            String fallbackUrgency,
            List<String> fallbackActions
    ) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Patient: ").append(patient.getUser().getFullName()).append('\n');
        prompt.append("Conditions: ").append(blankOr(patient.getDiseases(), "None recorded")).append('\n');
        prompt.append("Latest health: ").append(describeLatestHealth(latestHealth)).append('\n');
        prompt.append("Latest triage: ").append(describeLatestTriage(latestTriageAssessment)).append('\n');
        prompt.append("Latest consultation: ").append(describeLatestConsultation(latestConsultation)).append('\n');
        prompt.append("Active alerts: ").append(describeAlerts(activeAlerts)).append('\n');
        prompt.append("Pending reminders: ").append(pendingReminders).append('\n');
        prompt.append("Recent medicines: ").append(describeMedicines(recentMedicationItems)).append('\n');
        prompt.append("Upcoming appointment: ").append(describeUpcomingAppointment(patient.getId())).append('\n');
        prompt.append("Recent chat history:\n").append(describeRecentConversation(recentConversation));
        prompt.append("Current patient question: ").append(question).append('\n');
        prompt.append("Baseline local guidance already prepared:\n");
        prompt.append("Urgency: ").append(fallbackUrgency).append('\n');
        prompt.append("Answer: ").append(fallbackAnswer).append('\n');
        prompt.append("Actions: ").append(String.join(" | ", fallbackActions)).append('\n');
        prompt.append("Please improve the answer so it sounds more like a real care assistant while staying strictly inside the supplied record.");
        return prompt.toString();
    }

    private ChatbotDtos.ChatResponse toResponse(PatientChatMessage message) {
        List<String> actions = message.getSuggestedActions() == null || message.getSuggestedActions().isBlank()
                ? List.of()
                : Arrays.stream(message.getSuggestedActions().split("\\|\\|")).toList();
        return new ChatbotDtos.ChatResponse(
                message.getId(),
                message.getQuestion(),
                message.getAnswer(),
                message.getUrgencyLabel(),
                actions,
                message.getCreatedAt()
        );
    }

    private List<MedicationItem> recentMedicationItems(Long patientId) {
        return prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream()
                .limit(12)
                .flatMap(prescription -> medicationItemRepository.findByPrescriptionId(prescription.getId()).stream())
                .sorted(Comparator.comparing(MedicationItem::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    private List<MedicationItem> filterMedicines(List<MedicationItem> items, String... keywords) {
        return items.stream()
                .filter(item -> {
                    String name = item.getMedicineName() == null ? "" : item.getMedicineName().toLowerCase(Locale.ROOT);
                    return Arrays.stream(keywords).anyMatch(name::contains);
                })
                .toList();
    }

    private List<MedicationItem> medicationsMentionedInQuestion(List<MedicationItem> items, String question) {
        return items.stream()
                .filter(item -> item.getMedicineName() != null && question.contains(item.getMedicineName().toLowerCase(Locale.ROOT)))
                .toList();
    }

    private boolean containsAny(String text, String... candidates) {
        return Arrays.stream(candidates).anyMatch(text::contains);
    }

    private boolean isCriticalBloodPressure(String bloodPressure) {
        if (bloodPressure == null || !bloodPressure.contains("/")) {
            return false;
        }
        try {
            String[] parts = bloodPressure.split("/");
            int systolic = Integer.parseInt(parts[0].trim());
            int diastolic = Integer.parseInt(parts[1].trim());
            return systolic >= 160 || diastolic >= 100;
        } catch (NumberFormatException ex) {
            return false;
        }
    }

    private String summarizeMedicines(List<MedicationItem> items) {
        return items.stream()
                .map(item -> item.getMedicineName() + " " + item.getDosage() + " " + item.getFrequency())
                .distinct()
                .limit(3)
                .collect(Collectors.joining(", "));
    }

    private String describeMedicines(List<MedicationItem> items) {
        if (items == null || items.isEmpty()) {
            return "No recent medicines on file";
        }
        return items.stream()
                .map(item -> item.getMedicineName() + " " + item.getDosage() + " " + item.getFrequency()
                        + (item.getNotes() == null || item.getNotes().isBlank() ? "" : " (" + item.getNotes().trim() + ")"))
                .distinct()
                .limit(6)
                .collect(Collectors.joining("; "));
    }

    private String describeLatestHealth(HealthRecord latestHealth) {
        if (latestHealth == null) {
            return "No recent vitals recorded";
        }
        String measuredAt = latestHealth.getRecordedAt() == null ? "unknown time"
                : latestHealth.getRecordedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        return "Recorded " + measuredAt
                + ", BP " + blankOr(latestHealth.getBloodPressure(), "-")
                + ", Sugar " + safeNumber(latestHealth.getSugar())
                + ", SpO2 " + safeNumber(latestHealth.getSpo2())
                + ", Pulse " + safeNumber(latestHealth.getPulse())
                + ", Temperature " + safeNumber(latestHealth.getTemperature())
                + ", Alert " + (latestHealth.getAlertSeverity() == null ? "INFO" : latestHealth.getAlertSeverity().name())
                + (latestHealth.getAlertMessage() == null || latestHealth.getAlertMessage().isBlank() ? "" : ", Message: " + latestHealth.getAlertMessage());
    }

    private String describeLatestTriage(TriageAssessment latestTriageAssessment) {
        if (latestTriageAssessment == null) {
            return "No recent triage";
        }
        return latestTriageAssessment.getLevel().name()
                + " | Symptoms: " + blankOr(latestTriageAssessment.getSymptoms(), "Not recorded")
                + " | Recommendation: " + blankOr(latestTriageAssessment.getRecommendation(), "Not recorded");
    }

    private String describeLatestConsultation(ConsultationNote latestConsultation) {
        if (latestConsultation == null) {
            return "No recent consultation note";
        }
        return "Doctor " + latestConsultation.getDoctor().getUser().getFullName()
                + " | Outcome " + latestConsultation.getOutcome().name()
                + " | Notes: " + summarizeClinicalNote(latestConsultation.getNotes())
                + (latestConsultation.getFollowUpDate() == null ? "" : " | Follow-up " + latestConsultation.getFollowUpDate());
    }

    private String describeAlerts(List<AlertNotification> activeAlerts) {
        if (activeAlerts == null || activeAlerts.isEmpty()) {
            return "No active alerts";
        }
        return activeAlerts.stream()
                .limit(3)
                .map(alert -> alert.getSeverity().name() + ": " + alert.getMessage())
                .collect(Collectors.joining(" | "));
    }

    private String describeUpcomingAppointment(Long patientId) {
        return appointmentRepository.findByPatientIdOrderByAppointmentDateTimeDesc(patientId).stream()
                .filter(item -> item.getAppointmentDateTime() != null && item.getAppointmentDateTime().isAfter(java.time.LocalDateTime.now()))
                .sorted(Comparator.comparing(item -> item.getAppointmentDateTime()))
                .findFirst()
                .map(item -> item.getAppointmentDateTime().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                        + " with " + item.getDoctor().getUser().getFullName()
                        + " (" + item.getStatus().name() + ")")
                .orElse("No upcoming appointment on file");
    }

    private String describeRecentConversation(List<PatientChatMessage> recentConversation) {
        if (recentConversation == null || recentConversation.isEmpty()) {
            return "No recent chat history.\n";
        }
        return recentConversation.stream()
                .limit(4)
                .sorted(Comparator.comparing(PatientChatMessage::getCreatedAt))
                .map(item -> "- Q: " + item.getQuestion() + " | A: " + summarizeClinicalNote(item.getAnswer()))
                .collect(Collectors.joining("\n", "", "\n"));
    }

    private String summarizeClinicalNote(String notes) {
        if (notes == null || notes.isBlank()) {
            return "";
        }



        String compact = notes.replaceAll("\\s+", " ").trim();
        return compact.length() > 160 ? compact.substring(0, 157) + "..." : compact;
    }

    private String recentNoteContext(String latestConsultationNote) {
        if (latestConsultationNote == null || latestConsultationNote.isBlank()) {
            return "";
        }
        return "Recent doctor note: " + latestConsultationNote;
    }

    private String formatNumber(Double value) {
        if (value == null) {
            return "-";
        }
        if (Math.floor(value) == value) {
            return String.valueOf(value.intValue());
        }
        return String.format(Locale.ENGLISH, "%.1f", value);
    }

    private String safeNumber(Double value) {
        return value == null ? "-" : formatNumber(value);
    }

    private String blankOr(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
