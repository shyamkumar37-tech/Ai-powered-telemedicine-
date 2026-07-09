package com.telecareplus.service.impl;

import com.telecareplus.entity.Patient;
import com.telecareplus.entity.enums.RiskLevel;
import com.telecareplus.repository.PatientRepository;
import com.telecareplus.repository.HealthRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.ai.chat.client.ChatClient;
import java.util.List;

@Service
@Slf4j
public class PredictiveRiskService {

    private final PatientRepository patientRepository;
    private final HealthRecordRepository healthRecordRepository;
    private final ChatClient chatClient;

    public PredictiveRiskService(PatientRepository patientRepository, HealthRecordRepository healthRecordRepository, ChatClient.Builder chatClientBuilder) {
        this.patientRepository = patientRepository;
        this.healthRecordRepository = healthRecordRepository;
        this.chatClient = chatClientBuilder.build();
    }

    // Run every night at 2 AM
    @Scheduled(cron = "0 0 2 * * ?")
    public void analyzePatientRisks() {
        log.info("Starting predictive risk analysis for patients...");
        List<Patient> patients = patientRepository.findAll();
        
        for (Patient patient : patients) {
            try {
                var records = healthRecordRepository.findTop10ByPatientIdOrderByRecordedAtDesc(patient.getId());
                if (records.isEmpty()) continue;
                
                StringBuilder context = new StringBuilder("Patient Vitals History:\n");
                records.forEach(r -> context.append(String.format("Date: %s, BP: %s, Sugar: %s, SpO2: %s\n", 
                        r.getRecordedAt(), r.getBloodPressure(), r.getSugar(), r.getSpo2())));
                        
                String prompt = "You are an AI Clinical Risk Assessor. Based on these recent vitals, classify the patient's readmission risk strictly as LOW, MODERATE, HIGH, or CRITICAL. Reply with exactly one word.\n\n" + context;
                
                String riskResult = chatClient.prompt().user(prompt).call().content().trim().toUpperCase();
                
                try {
                    RiskLevel level = RiskLevel.valueOf(riskResult);
                    log.info("Calculated predictive risk for patient {}: {}", patient.getId(), level);
                    // Could store in a dedicated RiskAssessment table in future phases.
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid risk level returned by AI: {}", riskResult);
                }
            } catch (Exception e) {
                log.error("Failed to analyze risk for patient {}", patient.getId(), e);
            }
        }
        log.info("Completed predictive risk analysis.");
    }
}
