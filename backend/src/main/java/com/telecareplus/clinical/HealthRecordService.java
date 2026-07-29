package com.telecareplus.clinical;

import com.telecareplus.clinical.HealthDtos;
import java.util.List;

public interface HealthRecordService {
    HealthDtos.HealthRecordResponse createRecord(HealthDtos.HealthRecordRequest request);
    List<HealthDtos.HealthRecordResponse> getPatientRecords(Long patientId);
    HealthDtos.HealthTrendSummaryResponse getTrendSummary(Long patientId);
}
