package com.telecareplus.controller;

import com.telecareplus.dto.PrescriptionDtos;
import com.telecareplus.service.PrescriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.telecareplus.annotation.AuditLog;

@RestController
@RequestMapping("/api/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR') and @accessScopeAuthorizer.canAccessConsultation(authentication, #request.consultationNoteId())")
    @AuditLog(action = "CREATE_PRESCRIPTION", resourceType = "PRESCRIPTION")
    public PrescriptionDtos.PrescriptionResponse create(@Valid @RequestBody PrescriptionDtos.PrescriptionRequest request) {
        return prescriptionService.createPrescription(request);
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('PATIENT','CAREGIVER') and @medicalAccessAuthorizer.canViewMedicationHistory(authentication, #patientId)")
    @AuditLog(action = "VIEW_PRESCRIPTIONS", resourceType = "PRESCRIPTION")
    public Page<PrescriptionDtos.PrescriptionResponse> list(@PathVariable Long patientId, Pageable pageable) {
        return prescriptionService.getPatientPrescriptions(patientId, pageable);
    }

    @GetMapping("/consultation/{consultationNoteId}")
    @PreAuthorize("hasRole('DOCTOR') and @accessScopeAuthorizer.canAccessConsultationPrescription(authentication, #consultationNoteId)")
    public PrescriptionDtos.PrescriptionResponse byConsultation(@PathVariable Long consultationNoteId) {
        return prescriptionService.getPrescriptionByConsultationId(consultationNoteId);
    }

    @GetMapping("/{prescriptionId}")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR') and @accessScopeAuthorizer.canAccessPrescription(authentication, #prescriptionId)")
    public PrescriptionDtos.PrescriptionResponse getOne(@PathVariable Long prescriptionId) {
        return prescriptionService.getPrescription(prescriptionId);
    }
}
