package com.telecareplus.service;

import com.telecareplus.dto.IntelligenceDtos;
import java.util.List;

public interface IntelligenceService {
    List<IntelligenceDtos.TimelineEventResponse> getPatientTimeline(Long patientId);
    IntelligenceDtos.CareComplianceResponse getCareCompliance(Long patientId);
    List<IntelligenceDtos.DoctorPriorityPatientResponse> getDoctorPriorityQueue(Long doctorId);
    List<IntelligenceDtos.MissedCareGapResponse> getCaregiverCareGaps(Long caregiverId);
    IntelligenceDtos.PatientEducationResponse getPatientEducation(Long patientId);
}
