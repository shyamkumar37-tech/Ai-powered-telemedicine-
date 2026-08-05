package com.telecareplus.jooq.query;

import static com.telecareplus.jooq.Tables.*;
import static org.jooq.impl.DSL.*;

import java.util.ArrayList;
import java.util.List;
import org.jooq.DSLContext;
import org.springframework.stereotype.Component;

@Component
public class AiReportQuery {

    private final DSLContext dsl;

    public AiReportQuery(DSLContext dsl) {
        this.dsl = dsl;
    }

    public PatientContext getPatientContext(Long patientId) {
        // Fetch recent complaints
        List<String> complaints = dsl.select(TRIAGE_ASSESSMENTS.RECOMMENDATION) // wait, schema says symptoms doesn't exist in jOOQ schema? Let's check schema.sql. Wait, in schema.sql, there is no 'symptoms' column. Only 'level' and 'recommendation'. Let's just fetch recommendation.
                .from(TRIAGE_ASSESSMENTS)
                .where(TRIAGE_ASSESSMENTS.PATIENT_ID.eq(patientId))
                .orderBy(TRIAGE_ASSESSMENTS.ASSESSED_AT.desc())
                .limit(2)
                .fetchInto(String.class);

        // Fetch consultation
        var consultation = dsl.select(CONSULTATION_NOTES.OUTCOME, CONSULTATION_NOTES.NOTES, CONSULTATION_NOTES.FOLLOW_UP_DATE)
                .from(CONSULTATION_NOTES)
                .where(CONSULTATION_NOTES.PATIENT_ID.eq(patientId))
                .orderBy(CONSULTATION_NOTES.CREATED_AT.desc())
                .limit(1)
                .fetchOne();

        String diagnosisSummary = "No consultation summary available yet.";
        List<String> followUpAdvice = new ArrayList<>();
        
        if (consultation != null) {
            String notes = consultation.get(CONSULTATION_NOTES.NOTES) == null ? "" : consultation.get(CONSULTATION_NOTES.NOTES);
            diagnosisSummary = "Latest consultation outcome: " + consultation.get(CONSULTATION_NOTES.OUTCOME)
                    + ". Notes: " + truncate(notes, 200);
            if (consultation.get(CONSULTATION_NOTES.FOLLOW_UP_DATE) != null) {
                followUpAdvice.add("Follow-up date: " + consultation.get(CONSULTATION_NOTES.FOLLOW_UP_DATE));
            }
        }

        // Fetch latest prescription
        var latestPrescriptionId = dsl.select(PRESCRIPTIONS.ID)
                .from(PRESCRIPTIONS)
                .where(PRESCRIPTIONS.PATIENT_ID.eq(patientId))
                .orderBy(PRESCRIPTIONS.CREATED_AT.desc())
                .limit(1)
                .fetchOne(PRESCRIPTIONS.ID);

        List<String> prescribedMedicines = new ArrayList<>();
        if (latestPrescriptionId != null) {
            var items = dsl.select(MEDICATION_ITEMS.MEDICINE_NAME, MEDICATION_ITEMS.DOSAGE, MEDICATION_ITEMS.FREQUENCY)
                .from(MEDICATION_ITEMS)
                .where(MEDICATION_ITEMS.PRESCRIPTION_ID.eq(latestPrescriptionId))
                .fetch();
            for (var item : items) {
                prescribedMedicines.add(item.value1() + " (" + item.value2() + ", " + item.value3() + ")");
            }
        }

        if (complaints.isEmpty()) {
            complaints.add("No recent triage complaints recorded.");
        }
        if (prescribedMedicines.isEmpty()) {
            prescribedMedicines.add("No prescriptions recorded yet.");
        }
        if (followUpAdvice.isEmpty()) {
            followUpAdvice.add("Continue prescribed care plan and monitor symptoms.");
        }

        return new PatientContext(complaints, diagnosisSummary, prescribedMedicines, followUpAdvice);
    }

    private String truncate(String value, int maxLength) {
        if (value == null) return "";
        String trimmed = value.trim();
        if (trimmed.length() <= maxLength) return trimmed;
        return trimmed.substring(0, maxLength).trim() + "...";
    }

    public record PatientContext(
        List<String> recentComplaints,
        String diagnosisSummary,
        List<String> prescribedMedicines,
        List<String> followUpAdvice
    ) {}
}
