package com.telecareplus.service;

import com.telecareplus.dto.AppointmentDtos;
import java.util.List;

public interface AppointmentService {
    AppointmentDtos.AppointmentResponse createAppointment(AppointmentDtos.AppointmentRequest request);
    List<AppointmentDtos.AppointmentResponse> getPatientAppointments(long patientId);
    List<AppointmentDtos.AppointmentResponse> getDoctorAppointments(long doctorId);
    AppointmentDtos.AppointmentResponse updateStatus(long appointmentId, AppointmentDtos.AppointmentStatusRequest request);
}
