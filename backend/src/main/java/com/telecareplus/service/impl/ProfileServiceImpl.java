package com.telecareplus.service.impl;

import com.telecareplus.dto.ProfileDtos;
import com.telecareplus.entity.Caregiver;
import com.telecareplus.entity.Doctor;
import com.telecareplus.entity.Patient;
import com.telecareplus.exception.ResourceNotFoundException;
import com.telecareplus.repository.CaregiverRepository;
import com.telecareplus.repository.DoctorRepository;
import com.telecareplus.repository.PatientRepository;
import com.telecareplus.repository.UserRepository;
import com.telecareplus.service.ProfileService;
import com.telecareplus.util.MapperUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ProfileServiceImpl implements ProfileService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final CaregiverRepository caregiverRepository;
    private final UserRepository userRepository;

    @Override
    public ProfileDtos.PatientProfileResponse getPatientProfile(Long patientId) {
        return MapperUtil.toPatientProfile(getPatient(patientId));
    }

    @Override
    public ProfileDtos.PatientProfileResponse updatePatientProfile(Long patientId, ProfileDtos.PatientProfileRequest request) {
        Patient patient = getPatient(patientId);
        patient.getUser().setFullName(request.fullName());
        patient.getUser().setEmail(request.email());
        patient.getUser().setPhone(request.phone());
        patient.getUser().setPreferredLanguage(request.preferredLanguage());
        patient.setAge(request.age());
        patient.setGender(request.gender());
        patient.setBloodGroup(request.bloodGroup());
        patient.setAllergies(request.allergies());
        patient.setDiseases(request.diseases());
        patient.setEmergencyContactName(request.emergencyContactName());
        patient.setEmergencyContactPhone(request.emergencyContactPhone());
        patient.setMedicalHistorySummary(request.medicalHistorySummary());
        userRepository.save(patient.getUser());
        return MapperUtil.toPatientProfile(patientRepository.save(patient));
    }

    @Override
    public ProfileDtos.DoctorProfileResponse getDoctorProfile(Long doctorId) {
        return MapperUtil.toDoctorProfile(getDoctor(doctorId));
    }

    @Override
    public ProfileDtos.DoctorProfileResponse updateDoctorProfile(Long doctorId, ProfileDtos.DoctorProfileRequest request) {
        Doctor doctor = getDoctor(doctorId);
        doctor.getUser().setFullName(request.fullName());
        doctor.getUser().setEmail(request.email());
        doctor.getUser().setPhone(request.phone());
        doctor.getUser().setPreferredLanguage(request.preferredLanguage());
        doctor.setSpecialization(request.specialization());
        doctor.setExperienceYears(request.experienceYears());
        doctor.setConsultationFee(request.consultationFee());
        doctor.setQualification(request.qualification());
        doctor.setAvailabilitySummary(request.availabilitySummary());
        doctor.setBio(request.bio());
        return MapperUtil.toDoctorProfile(doctorRepository.save(doctor));
    }

    @Override
    public ProfileDtos.CaregiverProfileResponse getCaregiverProfile(Long caregiverId) {
        return MapperUtil.toCaregiverProfile(getCaregiver(caregiverId));
    }

    @Override
    public ProfileDtos.CaregiverProfileResponse updateCaregiverProfile(Long caregiverId, ProfileDtos.CaregiverProfileRequest request) {
        Caregiver caregiver = getCaregiver(caregiverId);
        caregiver.getUser().setFullName(request.fullName());
        caregiver.getUser().setEmail(request.email());
        caregiver.getUser().setPhone(request.phone());
        caregiver.getUser().setPreferredLanguage(request.preferredLanguage());
        caregiver.setRelationshipLabel(request.relationshipLabel());
        return MapperUtil.toCaregiverProfile(caregiverRepository.save(caregiver));
    }

    private Patient getPatient(Long patientId) {
        return patientRepository.findById(patientId).orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
    }

    private Doctor getDoctor(Long doctorId) {
        return doctorRepository.findById(doctorId).orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
    }

    private Caregiver getCaregiver(Long caregiverId) {
        return caregiverRepository.findById(caregiverId).orElseThrow(() -> new ResourceNotFoundException("Caregiver not found"));
    }
}
