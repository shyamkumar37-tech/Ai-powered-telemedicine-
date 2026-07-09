package com.telecareplus.service;

import com.telecareplus.dto.CaregiverDtos;
import java.util.List;

public interface CaregiverService {
    void linkPatient(CaregiverDtos.CaregiverLinkRequest request);
    List<CaregiverDtos.LinkedPatientResponse> getLinkedPatients(Long caregiverId);
    void inviteCaregiver(CaregiverDtos.CaregiverInviteRequest request);
}
