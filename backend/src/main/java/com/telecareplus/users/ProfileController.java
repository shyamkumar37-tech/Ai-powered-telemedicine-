package com.telecareplus.users;

import com.telecareplus.users.ProfileDtos;
import com.telecareplus.users.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/patients/{patientId}")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public ProfileDtos.PatientProfileResponse getPatientProfile(@PathVariable Long patientId) {
        return profileService.getPatientProfile(patientId);
    }

    @PutMapping("/patients/{patientId}")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public ProfileDtos.PatientProfileResponse updatePatientProfile(@PathVariable Long patientId, @Valid @RequestBody ProfileDtos.PatientProfileRequest request) {
        return profileService.updatePatientProfile(patientId, request);
    }

    @GetMapping("/doctors/{doctorId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'PATIENT')")
    public ProfileDtos.DoctorProfileResponse getDoctorProfile(@PathVariable Long doctorId) {
        return profileService.getDoctorProfile(doctorId);
    }

    @PutMapping("/doctors/{doctorId}")
    @PreAuthorize("hasRole('DOCTOR') and @accessScopeAuthorizer.canAccessDoctor(authentication, #doctorId)")
    public ProfileDtos.DoctorProfileResponse updateDoctorProfile(@PathVariable Long doctorId, @Valid @RequestBody ProfileDtos.DoctorProfileRequest request) {
        return profileService.updateDoctorProfile(doctorId, request);
    }

    @GetMapping("/caregivers/{caregiverId}")
    @PreAuthorize("hasRole('CAREGIVER') and @accessScopeAuthorizer.canAccessCaregiver(authentication, #caregiverId)")
    public ProfileDtos.CaregiverProfileResponse getCaregiverProfile(@PathVariable Long caregiverId) {
        return profileService.getCaregiverProfile(caregiverId);
    }

    @PutMapping("/caregivers/{caregiverId}")
    @PreAuthorize("hasRole('CAREGIVER') and @accessScopeAuthorizer.canAccessCaregiver(authentication, #caregiverId)")
    public ProfileDtos.CaregiverProfileResponse updateCaregiverProfile(@PathVariable Long caregiverId, @Valid @RequestBody ProfileDtos.CaregiverProfileRequest request) {
        return profileService.updateCaregiverProfile(caregiverId, request);
    }
}
