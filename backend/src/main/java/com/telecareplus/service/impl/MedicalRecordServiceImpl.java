package com.telecareplus.service.impl;

import com.telecareplus.dto.MedicalRecordDtos;
import com.telecareplus.exception.ResourceNotFoundException;
import com.telecareplus.repository.AlertNotificationRepository;
import com.telecareplus.repository.AppointmentRepository;
import com.telecareplus.repository.ConsultationNoteRepository;
import com.telecareplus.repository.MedicationItemRepository;
import com.telecareplus.repository.PatientRepository;
import com.telecareplus.repository.PrescriptionRepository;
import com.telecareplus.repository.TriageAssessmentRepository;
import com.telecareplus.service.HealthRecordService;
import com.telecareplus.service.MedicalRecordService;
import com.telecareplus.util.MapperUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MedicalRecordServiceImpl implements MedicalRecordService {

    private final PatientRepository patientRepository;
    private final TriageAssessmentRepository triageAssessmentRepository;
    private final AppointmentRepository appointmentRepository;
    private final ConsultationNoteRepository consultationNoteRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicationItemRepository medicationItemRepository;
    private final HealthRecordService healthRecordService;
    private final AlertNotificationRepository alertNotificationRepository;

    @Override
    public MedicalRecordDtos.PatientMedicalRecordResponse getPatientMedicalRecord(Long patientId) {
        var patient = patientRepository.findById(patientId).orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        return new MedicalRecordDtos.PatientMedicalRecordResponse(
                MapperUtil.toPatientProfile(patient),
                triageAssessmentRepository.findByPatientIdOrderByAssessedAtDesc(patientId).stream().map(MapperUtil::toTriageResponse).toList(),
                appointmentRepository.findByPatientIdOrderByAppointmentDateTimeDesc(patientId).stream().map(MapperUtil::toAppointmentResponse).toList(),
                consultationNoteRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream().map(MapperUtil::toConsultationResponse).toList(),
                prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream()
                        .map(prescription -> MapperUtil.toPrescriptionResponse(
                                prescription,
                                medicationItemRepository.findByPrescriptionId(prescription.getId())
                        ))
                        .toList(),
                healthRecordService.getPatientRecords(patientId),
                alertNotificationRepository.findByPatientIdAndActiveTrueOrderByCreatedAtDesc(patientId).stream()
                        .map(alert -> new MedicalRecordDtos.AlertResponse(
                                alert.getId(),
                                alert.getSeverity(),
                                alert.getMessage(),
                                alert.isActive()
                        ))
                        .toList()
        );
    }
}
