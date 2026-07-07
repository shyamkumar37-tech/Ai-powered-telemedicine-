package com.telecareplus.service.impl;

import com.telecareplus.dto.AppointmentDtos;
import com.telecareplus.entity.Appointment;
import com.telecareplus.entity.enums.AppointmentStatus;
import com.telecareplus.entity.enums.TriageLevel;
import com.telecareplus.exception.BadRequestException;
import com.telecareplus.exception.ResourceNotFoundException;
import com.telecareplus.repository.AppointmentRepository;
import com.telecareplus.repository.DoctorRepository;
import com.telecareplus.repository.PatientRepository;
import com.telecareplus.repository.TriageAssessmentRepository;
import com.telecareplus.service.AppointmentService;
import com.telecareplus.util.MapperUtil;
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
    private final TriageAssessmentRepository triageAssessmentRepository;

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
            var triage = triageAssessmentRepository.findById(request.triageAssessmentId()).orElseThrow(() -> new ResourceNotFoundException("Triage record not found"));
            if (triage.getLevel() == TriageLevel.EMERGENCY_GO_TO_HOSPITAL) {
                throw new BadRequestException("Emergency cases must not proceed through normal teleconsult booking");
            }
            appointment.setTriageAssessment(triage);
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
        return MapperUtil.toAppointmentResponse(appointmentRepository.save(appointment));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentDtos.AppointmentResponse> getPatientAppointments(long patientId) {
        return appointmentRepository.findByPatientIdOrderByAppointmentDateTimeDesc(patientId).stream().map(MapperUtil::toAppointmentResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AppointmentDtos.AppointmentResponse> getDoctorAppointments(long doctorId) {
        return appointmentRepository.findByDoctorIdOrderByAppointmentDateTimeDesc(doctorId).stream().map(MapperUtil::toAppointmentResponse).toList();
    }

    @Override
    @Transactional
    public AppointmentDtos.AppointmentResponse updateStatus(long appointmentId, AppointmentDtos.AppointmentStatusRequest request) {
        Appointment appointment = appointmentRepository.findWithDetailsById(appointmentId).orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        appointment.setStatus(request.status());
        return MapperUtil.toAppointmentResponse(appointmentRepository.save(appointment));
    }
}
