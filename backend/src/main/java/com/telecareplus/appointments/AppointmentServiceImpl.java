package com.telecareplus.appointments;

import com.telecareplus.users.Doctor;
import com.telecareplus.users.Patient;

import com.telecareplus.appointments.AppointmentDtos;
import com.telecareplus.appointments.Appointment;
import com.telecareplus.appointments.AppointmentStatus;
import com.telecareplus.common.BadRequestException;
import com.telecareplus.common.ResourceNotFoundException;
import com.telecareplus.appointments.AppointmentRepository;
import com.telecareplus.users.DoctorRepository;
import com.telecareplus.users.PatientRepository;
import com.telecareplus.appointments.AppointmentService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;


    @Override
    @Transactional
    public AppointmentDtos.AppointmentResponse createAppointment(AppointmentDtos.AppointmentRequest request) {
        var doctor = doctorRepository.findByIdForUpdate(request.doctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        if (appointmentRepository.existsByDoctorIdAndAppointmentDateTime(request.doctorId(), request.appointmentDateTime())) {
            throw new BadRequestException("Doctor is unavailable at the selected slot");
        }

        Appointment appointment = new Appointment();
        appointment.setPatient(patientRepository.findById(request.patientId()).orElseThrow(() -> new ResourceNotFoundException("Patient not found")));
        appointment.setDoctor(doctor);
        if (request.triageAssessmentId() != null) {
            appointment.setTriageAssessmentId(request.triageAssessmentId());
        }
        appointment.setAppointmentDateTime(request.appointmentDateTime());
        appointment.setMode(request.mode());
        String concernSummary = request.concernSummary();
        if (concernSummary != null) {
            concernSummary = concernSummary.trim();
            if (concernSummary.isEmpty()) {
                concernSummary = null;
            }
        }
        appointment.setConcernSummary(concernSummary);
        appointment.setStatus(AppointmentStatus.BOOKED);
        return toAppointmentResponse(appointmentRepository.save(appointment));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentDtos.AppointmentResponse> getPatientAppointments(long patientId) {
        return appointmentRepository.findByPatientIdOrderByAppointmentDateTimeDesc(patientId).stream().map(this::toAppointmentResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentDtos.AppointmentResponse> getDoctorAppointments(long doctorId) {
        return appointmentRepository.findByDoctorIdOrderByAppointmentDateTimeDesc(doctorId).stream().map(this::toAppointmentResponse).toList();
    }

    @Override
    @Transactional
    public AppointmentDtos.AppointmentResponse updateStatus(long appointmentId, AppointmentDtos.AppointmentStatusRequest request) {
        Appointment appointment = appointmentRepository.findWithDetailsById(appointmentId).orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        appointment.setStatus(request.status());
        return toAppointmentResponse(appointmentRepository.save(appointment));
    }

    private AppointmentDtos.AppointmentResponse toAppointmentResponse(Appointment appointment) {
        return new AppointmentDtos.AppointmentResponse(
                appointment.getId(),
                appointment.getPatient().getId(),
                appointment.getPatient().getUser().getFullName(),
                appointment.getDoctor().getId(),
                appointment.getDoctor().getUser().getFullName(),
                appointment.getAppointmentDateTime(),
                appointment.getStatus(),
                appointment.getMode(),
                appointment.getConcernSummary(),
                appointment.getTriageAssessmentId() != null ? String.valueOf(appointment.getTriageAssessmentId()) : null
        );
    }
}
