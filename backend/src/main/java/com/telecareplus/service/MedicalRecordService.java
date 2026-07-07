package com.telecareplus.service;

import com.telecareplus.dto.MedicalRecordDtos;

public interface MedicalRecordService {
    MedicalRecordDtos.PatientMedicalRecordResponse getPatientMedicalRecord(Long patientId);
}
