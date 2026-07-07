package com.telecareplus.controller;

import com.telecareplus.dto.MedicalRecordDtos;
import com.telecareplus.service.MedicalRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/medical-records")
@RequiredArgsConstructor
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public MedicalRecordDtos.PatientMedicalRecordResponse patientRecord(@PathVariable Long patientId) {
        return medicalRecordService.getPatientMedicalRecord(patientId);
    }
}
