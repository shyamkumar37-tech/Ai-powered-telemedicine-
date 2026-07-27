package com.telecareplus.service.impl;

import com.telecareplus.dto.DoctorDtos;
import com.telecareplus.entity.Doctor;
import com.telecareplus.exception.ResourceNotFoundException;
import com.telecareplus.repository.DoctorRepository;
import com.telecareplus.service.DoctorService;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DoctorServiceImpl implements DoctorService {

    private final DoctorRepository doctorRepository;

    @Override
    @org.springframework.cache.annotation.Cacheable(value = com.telecareplus.config.CacheConfig.CACHE_MEDIUM, key = "'allDoctors'")
    public List<DoctorDtos.DoctorSummaryResponse> getAllDoctors() {
        return doctorRepository.findAll().stream()
                .sorted(Comparator
                        .comparing(Doctor::getSpecialization, Comparator.nullsLast(String::compareToIgnoreCase))
                        .thenComparing(doctor -> doctor.getUser() != null ? doctor.getUser().getFullName() : "", Comparator.nullsLast(String::compareToIgnoreCase)))
                .map(this::toSummary)
                .toList();
    }

    @Override
    @org.springframework.cache.annotation.Cacheable(value = com.telecareplus.config.CacheConfig.CACHE_MEDIUM, key = "'doctor:' + #doctorId")
    public DoctorDtos.DoctorDetailsResponse getDoctor(long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
        return toDetails(doctor);
    }

    private DoctorDtos.DoctorSummaryResponse toSummary(Doctor doctor) {
        return new DoctorDtos.DoctorSummaryResponse(
                doctor.getId(),
                doctor.getUser() != null ? doctor.getUser().getFullName() : "Unknown",
                doctor.getSpecialization(),
                doctor.getExperienceYears(),
                doctor.getConsultationFee(),
                doctor.getAvailabilitySummary()
        );
    }

    private DoctorDtos.DoctorDetailsResponse toDetails(Doctor doctor) {
        return new DoctorDtos.DoctorDetailsResponse(
                doctor.getId(),
                doctor.getUser() != null ? doctor.getUser().getFullName() : "Unknown",
                doctor.getUser() != null ? doctor.getUser().getEmail() : "Unknown",
                doctor.getUser() != null ? doctor.getUser().getPhone() : "Unknown",
                doctor.getSpecialization(),
                doctor.getExperienceYears(),
                doctor.getConsultationFee(),
                doctor.getQualification(),
                doctor.getAvailabilitySummary(),
                doctor.getBio()
        );
    }
}
