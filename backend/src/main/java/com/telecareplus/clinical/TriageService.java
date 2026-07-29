package com.telecareplus.clinical;

import com.telecareplus.clinical.TriageDtos;
import java.util.List;

public interface TriageService {
    TriageDtos.TriageResponse createAssessment(TriageDtos.TriageRequest request);
    List<TriageDtos.TriageResponse> getPatientHistory(Long patientId);
}
