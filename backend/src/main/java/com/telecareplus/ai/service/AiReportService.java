package com.telecareplus.ai.service;

import com.telecareplus.ai.dto.AiDtos;
import com.telecareplus.entity.ConsultationNote;
import com.telecareplus.entity.MedicationItem;
import com.telecareplus.entity.Prescription;
import com.telecareplus.entity.TriageAssessment;
import com.telecareplus.exception.ResourceNotFoundException;
import com.telecareplus.repository.ConsultationNoteRepository;
import com.telecareplus.repository.MedicationItemRepository;
import com.telecareplus.repository.PatientRepository;
import com.telecareplus.repository.PrescriptionRepository;
import com.telecareplus.repository.TriageAssessmentRepository;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AiReportService {

    private final PatientRepository patientRepository;
    private final TriageAssessmentRepository triageAssessmentRepository;
    private final ConsultationNoteRepository consultationNoteRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicationItemRepository medicationItemRepository;

    public AiDtos.ReportSummaryResponse generateSummary(Long patientId) {
        var patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        var triageHistory = triageAssessmentRepository.findByPatientIdOrderByAssessedAtDesc(patientId);
        var consultations = consultationNoteRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
        var prescriptions = prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patientId);

        String patientName = patient.getUser().getFullName();
        String overview = buildOverview(patientName, patient.getAge(), patient.getGender(), patient.getDiseases(), patient.getAllergies());
        List<String> recentComplaints = buildRecentComplaints(triageHistory);
        String diagnosisSummary = buildDiagnosisSummary(consultations);
        List<String> prescribedMedicines = buildPrescriptionSummary(prescriptions);
        List<String> followUpAdvice = buildFollowUpAdvice(consultations, prescriptions);

        return new AiDtos.ReportSummaryResponse(
                patientName,
                overview,
                recentComplaints,
                diagnosisSummary,
                prescribedMedicines,
                followUpAdvice,
                "AI-generated summary for clinician review only. Not a diagnosis.",
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
