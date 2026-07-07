package com.telecareplus.service.impl;

import com.telecareplus.dto.IvrDtos;
import com.telecareplus.entity.Appointment;
import com.telecareplus.entity.Doctor;
import com.telecareplus.entity.IvrBookingSession;
import com.telecareplus.entity.Patient;
import com.telecareplus.entity.TriageAssessment;
import com.telecareplus.entity.enums.AppointmentStatus;
import com.telecareplus.entity.enums.ConsultationMode;
import com.telecareplus.entity.enums.IvrServiceType;
import com.telecareplus.entity.enums.IvrSessionStatus;
import com.telecareplus.exception.BadRequestException;
import com.telecareplus.exception.ResourceNotFoundException;
import com.telecareplus.repository.AppointmentRepository;
import com.telecareplus.repository.DoctorRepository;
import com.telecareplus.repository.IvrBookingSessionRepository;
import com.telecareplus.repository.PatientRepository;
import com.telecareplus.repository.TriageAssessmentRepository;
import com.telecareplus.service.IvrService;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class IvrServiceImpl implements IvrService {

    private final IvrBookingSessionRepository ivrBookingSessionRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final TriageAssessmentRepository triageAssessmentRepository;

    @Override
    public IvrDtos.SessionResponse startSession(IvrDtos.StartSessionRequest request) {
        Patient patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        if (request.serviceType() == IvrServiceType.APPOINTMENT) {
            if (request.appointmentDateTime() == null) {
                throw new BadRequestException("Requested appointment time is required");
            }
            if (request.concernSummary() == null || request.concernSummary().isBlank()) {
                throw new BadRequestException("Concern summary is required");
            }
        }

        IvrBookingSession session = new IvrBookingSession();
        session.setPatient(patient);
        session.setPhoneNumber(request.phoneNumber());
        session.setLanguageCode(request.languageCode());
        session.setServiceType(request.serviceType());
        session.setStatus(IvrSessionStatus.IN_PROGRESS);
        session.setSelectedMode(request.mode() == null ? ConsultationMode.TELECONSULTATION : request.mode());
        session.setRequestedDateTime(request.appointmentDateTime());
        session.setConcernSummary(request.concernSummary() == null ? null : request.concernSummary().trim());

        Appointment appointment = null;
        List<String> prompts = buildPrompts(patient, request.serviceType());
        if (request.serviceType() == IvrServiceType.APPOINTMENT) {
            Doctor doctor = doctorRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
            LocalDateTime requestedTime = request.appointmentDateTime();
            LocalDateTime scheduledTime = nextAvailableSlot(doctor.getId(), requestedTime);
            TriageAssessment latestTriage = triageAssessmentRepository.findByPatientIdOrderByAssessedAtDesc(patient.getId()).stream()
                    .findFirst()
                    .orElse(null);

            appointment = new Appointment();
            appointment.setPatient(patient);
            appointment.setDoctor(doctor);
            appointment.setTriageAssessment(latestTriage);
            appointment.setAppointmentDateTime(scheduledTime);
            appointment.setStatus(AppointmentStatus.BOOKED);
            appointment.setMode(session.getSelectedMode());
            appointment.setConcernSummary(request.concernSummary().trim());
            appointment = appointmentRepository.save(appointment);
            session.setAppointment(appointment);
            session.setTranscriptSummary("IVR booking created for " + patient.getUser().getFullName() + " with " + doctor.getUser().getFullName() + " on " + scheduledTime + ".");
            session.setStatus(IvrSessionStatus.COMPLETED);
        } else {
            session.setTranscriptSummary(defaultTranscript(patient, request.serviceType()));
            session.setStatus(IvrSessionStatus.COMPLETED);
        }

        IvrBookingSession saved = ivrBookingSessionRepository.save(session);
        return toResponse(saved, prompts);
    }

    @Override
    public List<IvrDtos.SessionResponse> getPatientSessions(Long patientId) {
        patientRepository.findById(patientId).orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        return ivrBookingSessionRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream()
                .map(session -> toResponse(session, buildPrompts(session.getPatient(), session.getServiceType())))
                .toList();
    }

    private LocalDateTime nextAvailableSlot(Long doctorId, LocalDateTime requestedTime) {
        LocalDateTime candidate = requestedTime.withSecond(0).withNano(0);
        for (int attempt = 0; attempt < 24; attempt++) {
            if (!appointmentRepository.existsByDoctorIdAndAppointmentDateTime(doctorId, candidate)) {
                return candidate;
            }
            candidate = candidate.plusHours(1);
        }
        throw new BadRequestException("No IVR slot available right now. Try another time.");
    }

    private List<String> buildPrompts(Patient patient, IvrServiceType serviceType) {
        List<String> prompts = new ArrayList<>();
        prompts.add("Welcome to TeleCare+ IVR support for " + patient.getUser().getFullName() + ".");
        switch (serviceType) {
            case APPOINTMENT -> {
                prompts.add("Your request is being converted into a continuity appointment.");
                prompts.add("Please keep your concern summary short and clear.");
            }
            case PRESCRIPTION_STATUS -> {
                prompts.add("Use the prescriptions page to review your latest medicine plan.");
                prompts.add("A pharmacist can verify medicine pickup and stock availability.");
            }
            case MEDICATION_REMINDER -> {
                prompts.add("Use the reminders page to mark medicines taken or missed.");
                prompts.add("If doses were missed, request caregiver support today.");
            }
            case EMERGENCY_SUPPORT -> {
                prompts.add("If symptoms are severe, do not wait for routine teleconsultation.");
                prompts.add("Seek in-person emergency care immediately.");
            }
        }
        return prompts;
    }

    private String defaultTranscript(Patient patient, IvrServiceType serviceType) {
        return switch (serviceType) {
            case PRESCRIPTION_STATUS -> "IVR prescription-status support completed for " + patient.getUser().getFullName() + ".";
            case MEDICATION_REMINDER -> "IVR reminder support completed for " + patient.getUser().getFullName() + ".";
            case EMERGENCY_SUPPORT -> "IVR emergency guidance delivered for " + patient.getUser().getFullName() + ".";
            case APPOINTMENT -> "IVR appointment request completed for " + patient.getUser().getFullName() + ".";
        };
    }

    private IvrDtos.SessionResponse toResponse(IvrBookingSession session, List<String> prompts) {
        return new IvrDtos.SessionResponse(
                session.getId(),
                session.getPatient().getId(),
                session.getPatient().getUser().getFullName(),
                session.getPhoneNumber(),
                session.getLanguageCode(),
                session.getServiceType(),
                session.getStatus(),
                session.getAppointment() == null ? null : session.getAppointment().getId(),
                session.getAppointment() == null ? null : session.getAppointment().getDoctor().getUser().getFullName(),
                session.getTranscriptSummary(),
                prompts,
                session.getCreatedAt()
        );
    }
}
