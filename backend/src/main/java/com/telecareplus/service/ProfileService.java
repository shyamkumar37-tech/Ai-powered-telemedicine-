package com.telecareplus.service;

import com.telecareplus.dto.ProfileDtos;

public interface ProfileService {
    ProfileDtos.PatientProfileResponse getPatientProfile(Long patientId);
    ProfileDtos.PatientProfileResponse updatePatientProfile(Long patientId, ProfileDtos.PatientProfileRequest request);
    ProfileDtos.DoctorProfileResponse getDoctorProfile(Long doctorId);
    ProfileDtos.DoctorProfileResponse updateDoctorProfile(Long doctorId, ProfileDtos.DoctorProfileRequest request);
    ProfileDtos.CaregiverProfileResponse getCaregiverProfile(Long caregiverId);
    ProfileDtos.CaregiverProfileResponse updateCaregiverProfile(Long caregiverId, ProfileDtos.CaregiverProfileRequest request);
}
