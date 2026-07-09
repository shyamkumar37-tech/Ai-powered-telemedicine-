package com.telecareplus.controller;

import com.telecareplus.dto.IntelligenceDtos;
import com.telecareplus.service.IntelligenceService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/intelligence")
@RequiredArgsConstructor
public class IntelligenceController {

    private final IntelligenceService intelligenceService;

    @GetMapping("/patient/{patientId}/timeline")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public List<IntelligenceDtos.TimelineEventResponse> patientTimeline(@PathVariable Long patientId) {
        return intelligenceService.getPatientTimeline(patientId);
    }

    @GetMapping("/patient/{patientId}/compliance")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public IntelligenceDtos.CareComplianceResponse patientCompliance(@PathVariable Long patientId) {
        return intelligenceService.getCareCompliance(patientId);
    }

    @GetMapping("/patient/{patientId}/education")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public IntelligenceDtos.PatientEducationResponse patientEducation(@PathVariable Long patientId) {
        return intelligenceService.getPatientEducation(patientId);
    }

    @GetMapping("/doctor/{doctorId}/priority-queue")
    @PreAuthorize("hasRole('DOCTOR') and @accessScopeAuthorizer.canAccessDoctor(authentication, #doctorId)")
    public List<IntelligenceDtos.DoctorPriorityPatientResponse> doctorPriorityQueue(@PathVariable Long doctorId) {
        return intelligenceService.getDoctorPriorityQueue(doctorId);
    }

    @GetMapping("/caregiver/{caregiverId}/care-gaps")
    @PreAuthorize("hasRole('CAREGIVER') and @accessScopeAuthorizer.canAccessCaregiver(authentication, #caregiverId)")
    public List<IntelligenceDtos.MissedCareGapResponse> caregiverCareGaps(@PathVariable Long caregiverId) {
        return intelligenceService.getCaregiverCareGaps(caregiverId);
    }

    @PostMapping("/doctor/scribe")
    @PreAuthorize("hasRole('DOCTOR')")
    public IntelligenceDtos.AudioScribeResponse generateSoapNote(@RequestBody IntelligenceDtos.AudioScribeRequest request) {
        return intelligenceService.generateSoapNote(request);
    }

    @PostMapping("/doctor/drug-interactions")
    @PreAuthorize("hasRole('DOCTOR')")
    public IntelligenceDtos.DrugInteractionResponse checkDrugInteractions(@RequestBody IntelligenceDtos.DrugInteractionRequest request) {
        return intelligenceService.checkDrugInteractions(request);
    }

    @PostMapping("/doctor/dosage")
    @PreAuthorize("hasRole('DOCTOR')")
    public IntelligenceDtos.DosageCalculationResponse calculateDosage(@RequestBody IntelligenceDtos.DosageCalculationRequest request) {
        return intelligenceService.calculateDosage(request);
    }

    @PostMapping("/doctor/alternatives")
    @PreAuthorize("hasRole('DOCTOR')")
    public IntelligenceDtos.FormularySubstituteResponse suggestAlternatives(@RequestBody IntelligenceDtos.FormularySubstituteRequest request) {
        return intelligenceService.suggestAlternatives(request);
    }

    @PostMapping("/doctor/copilot")
    @PreAuthorize("hasRole('DOCTOR')")
    public IntelligenceDtos.CopilotResponse askCopilot(@RequestBody IntelligenceDtos.CopilotRequest request) {
        return intelligenceService.askCopilot(request);
    }

    @PostMapping(value = "/doctor/ocr", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('DOCTOR')")
    public IntelligenceDtos.OcrPrescriptionResponse extractPrescriptionFromImage(
            @RequestParam("image") org.springframework.web.multipart.MultipartFile image) {
        return intelligenceService.extractPrescriptionFromImage(image);
    }

    @PostMapping(value = "/doctor/scribe/audio", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('DOCTOR')")
    public IntelligenceDtos.AudioScribeResponse transcribeAudioToSoapNote(
            @RequestParam("audio") org.springframework.web.multipart.MultipartFile audio) {
        return intelligenceService.transcribeAudioToSoapNote(audio);
    }
}
