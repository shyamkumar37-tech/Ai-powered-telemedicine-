package com.telecareplus.service;

import com.telecareplus.dto.IvrDtos;
import java.util.List;

public interface IvrService {
    IvrDtos.SessionResponse startSession(IvrDtos.StartSessionRequest request);
    List<IvrDtos.SessionResponse> getPatientSessions(Long patientId);
}
