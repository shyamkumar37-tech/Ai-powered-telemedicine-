package com.telecareplus.appointments;

import com.telecareplus.appointments.IvrDtos;
import com.telecareplus.appointments.Appointment;
import com.telecareplus.users.Doctor;
import com.telecareplus.appointments.IvrBookingSession;
import com.telecareplus.users.Patient;
import com.telecareplus.clinical.TriageAssessment;
import com.telecareplus.appointments.AppointmentStatus;
import com.telecareplus.common.ConsultationMode;
import com.telecareplus.appointments.IvrServiceType;
import com.telecareplus.appointments.IvrSessionStatus;
import com.telecareplus.common.BadRequestException;
import com.telecareplus.common.ResourceNotFoundException;
import com.telecareplus.appointments.AppointmentRepository;
import com.telecareplus.users.DoctorRepository;
import com.telecareplus.appointments.IvrBookingSessionRepository;
import com.telecareplus.users.PatientRepository;
import com.telecareplus.clinical.TriageAssessmentRepository;
import com.telecareplus.appointments.IvrService;
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
            appointment = new Appointment();
            appointment.setPatient(patient);
            appointment.setDoctor(doctor);
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
