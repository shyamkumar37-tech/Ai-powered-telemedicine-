package com.telecareplus.service;

import com.telecareplus.dto.CaregiverInterventionDtos;
import java.util.List;

public interface CaregiverInterventionService {
    CaregiverInterventionDtos.CaregiverInterventionResponse create(CaregiverInterventionDtos.CaregiverInterventionRequest request);
    List<CaregiverInterventionDtos.CaregiverInterventionResponse> listByCaregiver(Long caregiverId);
    CaregiverInterventionDtos.CaregiverInterventionResponse updateStatus(Long interventionId, CaregiverInterventionDtos.CaregiverInterventionStatusRequest request);
}
