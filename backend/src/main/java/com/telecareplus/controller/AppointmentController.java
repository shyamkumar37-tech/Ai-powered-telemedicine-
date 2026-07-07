package com.telecareplus.controller;

import com.telecareplus.dto.AppointmentDtos;
import com.telecareplus.service.AppointmentService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #request.patientId())")
    public AppointmentDtos.AppointmentResponse create(@Valid @RequestBody AppointmentDtos.AppointmentRequest request) {
        return appointmentService.createAppointment(request);
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public List<AppointmentDtos.AppointmentResponse> patientAppointments(@PathVariable long patientId) {
        return appointmentService.getPatientAppointments(patientId);
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasRole('DOCTOR') and @accessScopeAuthorizer.canAccessDoctor(authentication, #doctorId)")
    public List<AppointmentDtos.AppointmentResponse> doctorAppointments(@PathVariable long doctorId) {
        return appointmentService.getDoctorAppointments(doctorId);
    }

    @PatchMapping("/{appointmentId}/status")
    @PreAuthorize("hasRole('DOCTOR') and @accessScopeAuthorizer.canAccessDoctorAppointment(authentication, #appointmentId)")
    public AppointmentDtos.AppointmentResponse updateStatus(@PathVariable long appointmentId, @Valid @RequestBody AppointmentDtos.AppointmentStatusRequest request) {
        return appointmentService.updateStatus(appointmentId, request);
    }
}
