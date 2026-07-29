package com.telecareplus.ai;

import com.telecareplus.users.Patient;

import com.telecareplus.ai.AiDtos;
import com.telecareplus.clinical.ConsultationNote;
import com.telecareplus.pharmacy.MedicationItem;
import com.telecareplus.pharmacy.Prescription;
import com.telecareplus.clinical.TriageAssessment;
import com.telecareplus.common.ResourceNotFoundException;
import com.telecareplus.clinical.ConsultationNoteRepository;
import com.telecareplus.pharmacy.MedicationItemRepository;
import com.telecareplus.users.PatientRepository;
import com.telecareplus.pharmacy.PrescriptionRepository;
import com.telecareplus.clinical.TriageAssessmentRepository;
import com.telecareplus.ai.GenerativeAiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiReportService {

    private final PatientRepository patientRepository;
    private final TriageAssessmentRepository triageAssessmentRepository;
    private final ConsultationNoteRepository consultationNoteRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicationItemRepository medicationItemRepository;
    private final GenerativeAiService generativeAiService;
    private final ObjectMapper objectMapper;
    private final ChatClient.Builder chatClientBuilder;

    public SseEmitter generateSummaryStream(Long patientId, String language) {
        SseEmitter emitter = new SseEmitter(120000L); // 2 minutes timeout
        
        try {
            var patient = patientRepository.findById(patientId)
                    .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

            var triageHistory = triageAssessmentRepository.findByPatientIdOrderByAssessedAtDesc(patientId);
            var consultations = consultationNoteRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
            var prescriptions = prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patientId);

            String patientName = patient.getUser().getFullName();
            String overview = buildOverview(patientName, 0, patient.getGender(), patient.getDiseases(), patient.getAllergies());
            List<String> recentComplaints = buildRecentComplaints(triageHistory);
            String diagnosisSummary = buildDiagnosisSummary(consultations);
            List<String> prescribedMedicines = buildPrescriptionSummary(prescriptions);
            List<String> followUpAdvice = buildFollowUpAdvice(consultations, prescriptions);

            String systemPrompt = "You are a clinical AI Copilot. Summarize the patient's medical history into a concise, professional clinical summary. Format your response nicely in Markdown." +
                    " Respond strictly in the following language locale: " + language;
                    
            String userPrompt = "Patient: " + patientName + "\n" +
                    "Base Overview: " + overview + "\n" +
                    "Raw Complaints: " + String.join(" | ", recentComplaints) + "\n" +
                    "Raw Diagnosis: " + diagnosisSummary + "\n" +
                    "Raw Medicines: " + String.join(" | ", prescribedMedicines) + "\n" +
                    "Raw Follow-Up: " + String.join(" | ", followUpAdvice);

            ChatClient chatClient = chatClientBuilder.build();
            
            chatClient.prompt()
                      .system(systemPrompt)
                      .user(userPrompt)
                      .stream()
                      .content()
                      .subscribe(
                              token -> {
                                  try {
                                      emitter.send(token);
                                  } catch (Exception e) {
                                      log.error("Error sending SSE", e);
                                      emitter.completeWithError(e);
                                  }
                              },
                              error -> {
                                  log.error("Error generating stream", error);
                                  emitter.completeWithError(error);
                              },
                              () -> emitter.complete()
                      );
        } catch (Exception e) {
            log.error("Error in generateSummaryStream", e);
            emitter.completeWithError(e);
        }

        return emitter;
    }

    public AiDtos.ReportSummaryResponse generateSummary(Long patientId, String language) {
        var patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        var triageHistory = triageAssessmentRepository.findByPatientIdOrderByAssessedAtDesc(patientId);
        var consultations = consultationNoteRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
        var prescriptions = prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patientId);

        String patientName = patient.getUser().getFullName();
        String overview = buildOverview(patientName, 0, patient.getGender(), patient.getDiseases(), patient.getAllergies());
        List<String> recentComplaints = buildRecentComplaints(triageHistory);
        String diagnosisSummary = buildDiagnosisSummary(consultations);
        List<String> prescribedMedicines = buildPrescriptionSummary(prescriptions);
        List<String> followUpAdvice = buildFollowUpAdvice(consultations, prescriptions);

        if (generativeAiService.isConfigured()) {
            try {
                String systemPrompt = "You are a clinical AI Copilot. Summarize the patient's medical history into a concise, professional clinical summary. Respond ONLY with a JSON object exactly matching this structure, with no markdown formatting: " +
                        "{ \"overview\": \"string\", \"recentComplaints\": [\"string\"], \"diagnosisSummary\": \"string\", \"prescribedMedicines\": [\"string\"], \"followUpAdvice\": [\"string\"] }";
                systemPrompt += " Respond strictly in the following language locale: " + language;
                        
                String userPrompt = "Patient: " + patientName + "\n" +
                        "Base Overview: " + overview + "\n" +
                        "Raw Complaints: " + String.join(" | ", recentComplaints) + "\n" +
                        "Raw Diagnosis: " + diagnosisSummary + "\n" +
                        "Raw Medicines: " + String.join(" | ", prescribedMedicines) + "\n" +
                        "Raw Follow-Up: " + String.join(" | ", followUpAdvice);

                var aiResponse = generativeAiService.generateRawText(systemPrompt, userPrompt);
                
                if (aiResponse.isPresent()) {
                    String cleanJson = aiResponse.get().replaceAll("^```json\\s*", "").replaceAll("\\s*```$", "");
                    var jsonNode = objectMapper.readTree(cleanJson);
                    
                    List<String> aiComplaints = new ArrayList<>();
                    jsonNode.path("recentComplaints").forEach(n -> aiComplaints.add(n.asText()));
                    
                    List<String> aiMedicines = new ArrayList<>();
                    jsonNode.path("prescribedMedicines").forEach(n -> aiMedicines.add(n.asText()));
                    
                    List<String> aiFollowUp = new ArrayList<>();
                    jsonNode.path("followUpAdvice").forEach(n -> aiFollowUp.add(n.asText()));

                    return new AiDtos.ReportSummaryResponse(
                            patientName,
                            jsonNode.path("overview").asText(overview),
                            aiComplaints.isEmpty() ? recentComplaints : aiComplaints,
                            jsonNode.path("diagnosisSummary").asText(diagnosisSummary),
                            aiMedicines.isEmpty() ? prescribedMedicines : aiMedicines,
                            aiFollowUp.isEmpty() ? followUpAdvice : aiFollowUp,
                            "AI-generated summary for clinician review only. Verify details against full medical records.",
                            LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                    );
                }
            } catch (Exception e) {
                // Fallback to manual string builder if AI parsing fails
            }
        }

        return new AiDtos.ReportSummaryResponse(
                patientName,
                overview,
                recentComplaints,
                diagnosisSummary,
                prescribedMedicines,
                followUpAdvice,
                "Auto-generated summary. Not a diagnosis.",
                LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        );
    }

    private String buildOverview(String name, Integer age, String gender, String diseases, String allergies) {
        List<String> details = new ArrayList<>();
        if (age != null) {
            details.add("Age " + age);
        }
        if (gender != null && !gender.isBlank()) {
            details.add("Gender " + gender);
        }
        if (diseases != null && !diseases.isBlank()) {
            details.add("Known conditions: " + diseases);
        }
        if (allergies != null && !allergies.isBlank()) {
            details.add("Allergies: " + allergies);
        }
        return details.isEmpty()
                ? "Patient profile summary for " + name + "."
                : "Patient profile: " + String.join(". ", details) + ".";
    }

    private List<String> buildRecentComplaints(List<TriageAssessment> triageHistory) {
        List<String> complaints = new ArrayList<>();
        for (int i = 0; i < triageHistory.size() && complaints.size() < 2; i += 1) {
            var triage = triageHistory.get(i);
            if (triage.getSymptoms() != null && !triage.getSymptoms().isBlank()) {
                complaints.add(truncate(triage.getSymptoms(), 180));
            }
        }
        if (complaints.isEmpty()) {
            complaints.add("No recent triage complaints recorded.");
        }
        return complaints;
    }

    private String buildDiagnosisSummary(List<ConsultationNote> consultations) {
        if (consultations.isEmpty()) {
            return "No consultation summary available yet.";
        }
        var consultation = consultations.get(0);
        String notes = consultation.getNotes() == null ? "" : consultation.getNotes();
        return "Latest consultation outcome: " + consultation.getOutcome()
                + ". Notes: " + truncate(notes, 200);
    }

    private List<String> buildPrescriptionSummary(List<Prescription> prescriptions) {
        if (prescriptions.isEmpty()) {
            return List.of("No prescriptions recorded yet.");
        }
        Prescription prescription = prescriptions.get(0);
        List<MedicationItem> items = medicationItemRepository.findByPrescriptionId(prescription.getId());
        if (items.isEmpty()) {
            return List.of("Prescription issued without medicine list.");
        }
        return items.stream()
                .map(item -> item.getMedicineName() + " (" + item.getDosage() + ", " + item.getFrequency() + ")")
                .toList();
    }

    private List<String> buildFollowUpAdvice(List<ConsultationNote> consultations, List<Prescription> prescriptions) {
        List<String> advice = new ArrayList<>();
        if (!consultations.isEmpty() && consultations.get(0).getFollowUpDate() != null) {
            advice.add("Follow-up date: " + consultations.get(0).getFollowUpDate());
        }
        if (!prescriptions.isEmpty() && prescriptions.get(0).getFollowUpDate() != null) {
            advice.add("Prescription follow-up date: " + prescriptions.get(0).getFollowUpDate());
        }
        if (advice.isEmpty()) {
            advice.add("Continue prescribed care plan and monitor symptoms.");
        }
        return advice;
    }

    private String truncate(String value, int maxLength) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        if (trimmed.length() <= maxLength) {
            return trimmed;
        }
        return trimmed.substring(0, maxLength).trim() + "...";
    }
}
