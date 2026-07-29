package com.telecareplus.users;

import com.telecareplus.users.ProfileDtos;
import com.telecareplus.users.Caregiver;
import com.telecareplus.users.Doctor;
import com.telecareplus.users.Patient;
import com.telecareplus.common.ResourceNotFoundException;
import com.telecareplus.users.CaregiverRepository;
import com.telecareplus.users.DoctorRepository;
import com.telecareplus.users.PatientRepository;
import com.telecareplus.users.UserRepository;
import com.telecareplus.users.ProfileService;
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
        return toPatientProfile(getPatient(patientId));
    }

    @Override
    public ProfileDtos.PatientProfileResponse updatePatientProfile(Long patientId, ProfileDtos.PatientProfileRequest request) {
        Patient patient = getPatient(patientId);
        patient.getUser().setFullName(request.fullName());
        patient.getUser().setEmail(request.email());
        patient.getUser().setPhone(request.phone());
        patient.getUser().setPreferredLanguage(request.preferredLanguage());
        patient.setDateOfBirth(request.dateOfBirth());
        patient.setGender(request.gender());
        patient.setBloodGroup(request.bloodGroup());
        patient.setAllergies(request.allergies());
        patient.setDiseases(request.diseases());
        patient.setEmergencyContactName(request.emergencyContactName());
        patient.setEmergencyContactPhone(request.emergencyContactPhone());
        patient.setMedicalHistorySummary(request.medicalHistorySummary());
        patient.setHeight(request.height());
        patient.setWeight(request.weight());
        patient.setCurrentMedications(request.currentMedications());
        patient.setInsuranceInfo(request.insuranceInfo());
        patient.setProfileComplete(true);
        if (request.emailNotificationsEnabled() != null) patient.getUser().setEmailNotificationsEnabled(request.emailNotificationsEnabled());
        if (request.smsNotificationsEnabled() != null) patient.getUser().setSmsNotificationsEnabled(request.smsNotificationsEnabled());
        if (request.pushNotificationsEnabled() != null) patient.getUser().setPushNotificationsEnabled(request.pushNotificationsEnabled());
        userRepository.save(patient.getUser());
        return toPatientProfile(patientRepository.save(patient));
    }

    @Override
    public ProfileDtos.DoctorProfileResponse getDoctorProfile(Long doctorId) {
        return toDoctorProfile(getDoctor(doctorId));
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
        return toDoctorProfile(doctorRepository.save(doctor));
    }

    @Override
    public ProfileDtos.CaregiverProfileResponse getCaregiverProfile(Long caregiverId) {
        return toCaregiverProfile(getCaregiver(caregiverId));
    }

    @Override
    public ProfileDtos.CaregiverProfileResponse updateCaregiverProfile(Long caregiverId, ProfileDtos.CaregiverProfileRequest request) {
        Caregiver caregiver = getCaregiver(caregiverId);
        caregiver.getUser().setFullName(request.fullName());
        caregiver.getUser().setEmail(request.email());
        caregiver.getUser().setPhone(request.phone());
        caregiver.getUser().setPreferredLanguage(request.preferredLanguage());
        caregiver.setRelationshipLabel(request.relationshipLabel());
        return toCaregiverProfile(caregiverRepository.save(caregiver));
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

    private ProfileDtos.UserSummary toUserSummary(User user) {
        return new ProfileDtos.UserSummary(
                user.getId(), user.getFullName(), user.getEmail(), user.getPhone(), user.getPreferredLanguage(),
                user.isEmailNotificationsEnabled(), user.isSmsNotificationsEnabled(), user.isPushNotificationsEnabled()
        );
    }

    private ProfileDtos.PatientProfileResponse toPatientProfile(Patient patient) {
        return new ProfileDtos.PatientProfileResponse(
                patient.getId(), toUserSummary(patient.getUser()), patient.getDateOfBirth(), patient.getGender(), patient.getBloodGroup(),
                patient.getAllergies(), patient.getDiseases(), patient.getEmergencyContactName(), patient.getEmergencyContactPhone(),
                patient.getMedicalHistorySummary(), patient.getHeight(), patient.getWeight(), patient.getCurrentMedications(),
                patient.getInsuranceInfo(), patient.isProfileComplete()
        );
    }

    private ProfileDtos.DoctorProfileResponse toDoctorProfile(Doctor doctor) {
        return new ProfileDtos.DoctorProfileResponse(
                doctor.getId(), toUserSummary(doctor.getUser()), doctor.getSpecialization(), doctor.getExperienceYears(),
                doctor.getConsultationFee(), doctor.getQualification(),
                doctor.getAvailabilitySummary(), doctor.getBio()
        );
    }

    private ProfileDtos.CaregiverProfileResponse toCaregiverProfile(Caregiver caregiver) {
        return new ProfileDtos.CaregiverProfileResponse(caregiver.getId(), toUserSummary(caregiver.getUser()), caregiver.getRelationshipLabel());
    }
}
