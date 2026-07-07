package com.telecareplus.controller;

import com.telecareplus.dto.DoctorDtos;
import com.telecareplus.service.DoctorService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;

    @GetMapping
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'CAREGIVER', 'PHARMACIST', 'ADMIN')")
    public List<DoctorDtos.DoctorSummaryResponse> getAllDoctors() {
        return doctorService.getAllDoctors();
    }

    @GetMapping("/{doctorId}")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'CAREGIVER', 'PHARMACIST', 'ADMIN')")
    public DoctorDtos.DoctorDetailsResponse getDoctor(@PathVariable long doctorId) {
        return doctorService.getDoctor(doctorId);
    }
}
