package com.telecareplus.ai;

import com.telecareplus.ai.IntelligenceDtos;
import java.util.List;

public interface IntelligenceService {
    List<IntelligenceDtos.TimelineEventResponse> getPatientTimeline(Long patientId);
    IntelligenceDtos.CareComplianceResponse getCareCompliance(Long patientId);
    List<IntelligenceDtos.DoctorPriorityPatientResponse> getDoctorPriorityQueue(Long doctorId);
    List<IntelligenceDtos.MissedCareGapResponse> getCaregiverCareGaps(Long caregiverId);
    IntelligenceDtos.PatientEducationResponse getPatientEducation(Long patientId);

    IntelligenceDtos.AudioScribeResponse generateSoapNote(IntelligenceDtos.AudioScribeRequest request);
    IntelligenceDtos.DrugInteractionResponse checkDrugInteractions(IntelligenceDtos.DrugInteractionRequest request);
    IntelligenceDtos.DosageCalculationResponse calculateDosage(IntelligenceDtos.DosageCalculationRequest request);
    IntelligenceDtos.FormularySubstituteResponse suggestAlternatives(IntelligenceDtos.FormularySubstituteRequest request);

    IntelligenceDtos.CopilotResponse askCopilot(IntelligenceDtos.CopilotRequest request);
    IntelligenceDtos.OcrPrescriptionResponse extractPrescriptionFromImage(org.springframework.web.multipart.MultipartFile image);
    IntelligenceDtos.AudioScribeResponse transcribeAudioToSoapNote(org.springframework.web.multipart.MultipartFile audio);
}
