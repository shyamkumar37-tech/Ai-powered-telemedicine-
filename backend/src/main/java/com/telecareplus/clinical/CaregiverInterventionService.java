package com.telecareplus.clinical;

import com.telecareplus.clinical.CaregiverInterventionDtos;
import java.util.List;

public interface CaregiverInterventionService {
    CaregiverInterventionDtos.CaregiverInterventionResponse create(CaregiverInterventionDtos.CaregiverInterventionRequest request);
    List<CaregiverInterventionDtos.CaregiverInterventionResponse> listByCaregiver(Long caregiverId);
    CaregiverInterventionDtos.CaregiverInterventionResponse updateStatus(Long interventionId, CaregiverInterventionDtos.CaregiverInterventionStatusRequest request);
}
