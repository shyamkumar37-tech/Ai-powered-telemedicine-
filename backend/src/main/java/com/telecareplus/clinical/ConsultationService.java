package com.telecareplus.clinical;

import com.telecareplus.clinical.ConsultationDtos;
import java.util.List;

public interface ConsultationService {
    ConsultationDtos.ConsultationNoteResponse createConsultation(ConsultationDtos.ConsultationNoteRequest request);
    List<ConsultationDtos.ConsultationNoteResponse> getPatientConsultations(Long patientId);
    ConsultationDtos.ConsultationNoteResponse getConsultationByAppointmentId(Long appointmentId);
}
