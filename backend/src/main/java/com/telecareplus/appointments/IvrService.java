package com.telecareplus.appointments;

import com.telecareplus.appointments.IvrDtos;
import java.util.List;

public interface IvrService {
    IvrDtos.SessionResponse startSession(IvrDtos.StartSessionRequest request);
    List<IvrDtos.SessionResponse> getPatientSessions(Long patientId);
}
