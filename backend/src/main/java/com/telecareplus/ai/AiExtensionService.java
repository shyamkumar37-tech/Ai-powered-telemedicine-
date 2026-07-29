package com.telecareplus.ai;

import com.telecareplus.ai.AiExtensionDtos;
import com.telecareplus.ai.MlAnomalyService;
import com.telecareplus.notification.AlertNotification;
import com.telecareplus.clinical.HealthRecord;
import com.telecareplus.pharmacy.MedicationReminder;
import com.telecareplus.users.Patient;
import com.telecareplus.clinical.TriageAssessment;
import com.telecareplus.pharmacy.ReminderStatus;
import com.telecareplus.common.ResourceNotFoundException;
import com.telecareplus.notification.AlertNotificationRepository;
import com.telecareplus.clinical.HealthRecordRepository;
import com.telecareplus.pharmacy.MedicationReminderRepository;
import com.telecareplus.users.PatientRepository;
import com.telecareplus.clinical.TriageAssessmentRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiExtensionService {

    private final PatientRepository patientRepository;
    private final HealthRecordRepository healthRecordRepository;
    private final MedicationReminderRepository medicationReminderRepository;
    private final AlertNotificationRepository alertNotificationRepository;
    private final TriageAssessmentRepository triageAssessmentRepository;
    private final MlAnomalyService mlAnomalyService;

    @Value("${telecare.n8n.webhookUrl:}")
    private String n8nWebhookUrl;

    @Value("${telecare.n8n.token:}")
    private String n8nToken;

    public AiExtensionDtos.AnomalyReportResponse buildAnomalyReport(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        List<String> anomalies = new ArrayList<>();
        List<String> rationale = new ArrayList<>();
        String severity = "Low";

        mlAnomalyService.detect(patientId).ifPresent(result -> {
            rationale.addAll(result.reasons());
            if (result.score() > 0.55) {
                anomalies.add("ML anomaly score flagged the latest vitals.");
            }
        });

        List<HealthRecord> records = healthRecordRepository.findByPatientIdOrderByRecordedAtDesc(patientId);
        if (!records.isEmpty()) {
            HealthRecord latest = records.get(0);
            int[] bp = parseBloodPressure(latest.getBloodPressure());
            if (bp[0] > 140 || bp[1] > 90) {
                anomalies.add("Blood pressure spike detected in latest reading.");
                rationale.add("Latest BP value: " + latest.getBloodPressure());
                severity = "Medium";
            }
            if (latest.getSugar() != null && latest.getSugar() > 160) {
                anomalies.add("Blood sugar above target range.");
                rationale.add("Latest sugar value: " + latest.getSugar());
                severity = "Medium";
            }
            if (latest.getSpo2() != null && latest.getSpo2() < 94) {
                anomalies.add("Low SpO2 detected in latest reading.");
                rationale.add("Latest SpO2 value: " + latest.getSpo2());
                severity = "High";
            }
            if (latest.getTemperature() != null && latest.getTemperature() > 38.5) {
                anomalies.add("Temperature indicates fever.");
                rationale.add("Latest temperature value: " + latest.getTemperature());
                severity = "Medium";
            }
        } else {
            rationale.add("No vitals recorded recently for anomaly detection.");
        }

        List<MedicationReminder> reminders = medicationReminderRepository.findByPatientIdOrderByScheduledDateDesc(patientId);
        int missedStreak = calculateMissedStreak(reminders);
        if (missedStreak >= 3) {
            anomalies.add("Missed medication streak detected.");
            rationale.add("Missed reminders in a row: " + missedStreak);
            if (!"High".equals(severity)) {
                severity = "Medium";
            }
        }

        List<AlertNotification> activeAlerts = alertNotificationRepository.findByPatientIdAndActiveTrueOrderByCreatedAtDesc(patientId);
        if (!activeAlerts.isEmpty()) {
            anomalies.add("Active alert(s) are present for review.");
            rationale.add("Active alert count: " + activeAlerts.size());
            severity = "High";
        }

        List<TriageAssessment> triageHistory = triageAssessmentRepository.findByPatientIdOrderByAssessedAtDesc(patientId);
        if (!triageHistory.isEmpty() && triageHistory.get(0).getLevel() != null) {
            String level = triageHistory.get(0).getLevel().name();
            if (level.contains("EMERGENCY") || level.contains("IN_PERSON")) {
                anomalies.add("Recent triage indicates elevated risk.");
                rationale.add("Latest triage level: " + triageHistory.get(0).getLevel());
                severity = "High";
            }
        }

        if (anomalies.isEmpty()) {
            anomalies.add("No anomalies detected in recent signals.");
            rationale.add("Patient: " + patient.getUser().getFullName());
        }

        return new AiExtensionDtos.AnomalyReportResponse(
                severity,
                anomalies,
                rationale,
                "Anomaly detection is assistive and should be reviewed by clinicians."
        );
    }

    public AiExtensionDtos.RecommendationResponse buildRecommendations(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        List<String> recommendations = new ArrayList<>();
        List<String> rationale = new ArrayList<>();

        String diseases = patient.getDiseases() == null ? "" : patient.getDiseases().toLowerCase(Locale.ROOT);
        if (diseases.contains("diabetes")) {
            recommendations.add("Prefer low-glycemic meals and keep a consistent meal schedule.");
            rationale.add("Known diabetes history in patient profile.");
        }
        if (diseases.contains("hypertension") || diseases.contains("bp")) {
            recommendations.add("Limit sodium and monitor BP at least 3 times per week.");
            rationale.add("Known hypertension or BP history in patient profile.");
        }

        List<HealthRecord> records = healthRecordRepository.findByPatientIdOrderByRecordedAtDesc(patientId);
        if (!records.isEmpty()) {
            HealthRecord latest = records.get(0);
            if (latest.getSpo2() != null && latest.getSpo2() < 94) {
                recommendations.add("Prioritize breathing exercises and avoid overexertion.");
                rationale.add("Low SpO2 in latest vitals.");
            }
            if (latest.getSugar() != null && latest.getSugar() > 160) {
                recommendations.add("Review carbohydrate intake and hydration this week.");
                rationale.add("Elevated sugar in latest vitals.");
            }
        }

        long totalReminders = medicationReminderRepository.findByPatientIdOrderByScheduledDateDesc(patientId).size();
        long missed = medicationReminderRepository.countByPatientIdAndStatus(patientId, ReminderStatus.MISSED);
        if (totalReminders > 0 && missed > 0) {
            recommendations.add("Set smaller reminder windows around high-priority doses.");
            rationale.add("Missed medication reminders detected.");
        }

        if (recommendations.isEmpty()) {
            recommendations.add("Maintain hydration, sleep routine, and regular check-ins.");
            rationale.add("No high-risk signals detected in recent data.");
        }

        return new AiExtensionDtos.RecommendationResponse(
                recommendations,
                rationale,
                "Recommendations are supportive and not a substitute for clinician guidance."
        );
    }

    public AiExtensionDtos.WorkflowTriggerResponse triggerWorkflow(AiExtensionDtos.WorkflowTriggerRequest request) {
        if (n8nWebhookUrl == null || n8nWebhookUrl.isBlank()) {
            return new AiExtensionDtos.WorkflowTriggerResponse(
                    "UNAVAILABLE",
                    "Automation is not configured. Configure telecare.n8n.webhookUrl to enable workflows.",
                    LocalDateTime.now(),
                    List.of("n8n webhook URL not configured.")
            );
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (n8nToken != null && !n8nToken.isBlank()) {
                headers.set("X-N8N-TOKEN", n8nToken);
            }
            HttpEntity<AiExtensionDtos.WorkflowTriggerRequest> entity = new HttpEntity<>(request, headers);
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<String> response = restTemplate.postForEntity(n8nWebhookUrl, entity, String.class);
            return new AiExtensionDtos.WorkflowTriggerResponse(
                    response.getStatusCode().is2xxSuccessful() ? "OK" : "ERROR",
                    response.getStatusCode().is2xxSuccessful() ? "Workflow triggered." : "Workflow returned non-success status.",
                    LocalDateTime.now(),
                    List.of("Webhook response status: " + response.getStatusCode())
            );
        } catch (Exception ex) {
            log.warn("n8n workflow trigger failed: {}", ex.getMessage());
            return new AiExtensionDtos.WorkflowTriggerResponse(
                    "ERROR",
                    "Workflow trigger failed. Check n8n availability.",
                    LocalDateTime.now(),
                    List.of("Exception: " + ex.getClass().getSimpleName())
            );
        }
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

    private int[] parseBloodPressure(String value) {
        if (value == null || value.isBlank()) {
            return new int[]{0, 0};
        }
        String[] parts = value.split("/");
        if (parts.length < 2) {
            return new int[]{0, 0};
        }
        try {
            int systolic = Integer.parseInt(parts[0].trim());
            int diastolic = Integer.parseInt(parts[1].trim());
            return new int[]{systolic, diastolic};
        } catch (NumberFormatException ex) {
            return new int[]{0, 0};
        }
    }
}
