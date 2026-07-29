package com.telecareplus.clinical;

import com.telecareplus.clinical.MedicalRecordDtos;

public interface MedicalRecordService {
    MedicalRecordDtos.PatientMedicalRecordResponse getPatientMedicalRecord(Long patientId);
}
