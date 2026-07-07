package com.telecareplus.service;

import com.telecareplus.dto.PrescriptionDtos;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PrescriptionService {
    PrescriptionDtos.PrescriptionResponse createPrescription(PrescriptionDtos.PrescriptionRequest request);
    Page<PrescriptionDtos.PrescriptionResponse> getPatientPrescriptions(Long patientId, Pageable pageable);
    PrescriptionDtos.PrescriptionResponse getPrescriptionByConsultationId(Long consultationNoteId);
    PrescriptionDtos.PrescriptionResponse getPrescription(Long prescriptionId);
}
