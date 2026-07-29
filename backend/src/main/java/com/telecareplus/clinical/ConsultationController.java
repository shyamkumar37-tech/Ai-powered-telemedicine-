package com.telecareplus.clinical;

import com.telecareplus.clinical.ConsultationDtos;
import com.telecareplus.common.ResourceNotFoundException;
import com.telecareplus.clinical.ConsultationService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/consultations")
@RequiredArgsConstructor
public class ConsultationController {

    private final ConsultationService consultationService;

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR') and @accessScopeAuthorizer.canAccessDoctorAppointment(authentication, #request.appointmentId())")
    public ConsultationDtos.ConsultationNoteResponse create(@Valid @RequestBody ConsultationDtos.ConsultationNoteRequest request) {
        return consultationService.createConsultation(request);
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public List<ConsultationDtos.ConsultationNoteResponse> patientConsultations(@PathVariable Long patientId) {
        return consultationService.getPatientConsultations(patientId);
    }

    @GetMapping("/appointment/{appointmentId}")
    @PreAuthorize("hasRole('DOCTOR') and @accessScopeAuthorizer.canAccessDoctorAppointmentConsultation(authentication, #appointmentId)")
    public ResponseEntity<ConsultationDtos.ConsultationNoteResponse> appointmentConsultation(@PathVariable Long appointmentId) {
        try {
            return ResponseEntity.ok(consultationService.getConsultationByAppointmentId(appointmentId));
        } catch (ResourceNotFoundException ex) {
            return ResponseEntity.noContent().build();
        }
    }
}
