package com.telecareplus.service;

import com.telecareplus.dto.TriageDtos;
import java.util.List;

public interface TriageService {
    TriageDtos.TriageResponse createAssessment(TriageDtos.TriageRequest request);
    List<TriageDtos.TriageResponse> getPatientHistory(Long patientId);
}
