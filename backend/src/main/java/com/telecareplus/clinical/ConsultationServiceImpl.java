package com.telecareplus.clinical;

import com.telecareplus.appointments.Appointment;

import com.telecareplus.clinical.ConsultationDtos;
import com.telecareplus.clinical.ConsultationNote;
import com.telecareplus.appointments.AppointmentStatus;
import com.telecareplus.common.BadRequestException;
import com.telecareplus.common.ResourceNotFoundException;
import com.telecareplus.appointments.AppointmentRepository;
import com.telecareplus.clinical.ConsultationNoteRepository;
import com.telecareplus.clinical.ConsultationService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ConsultationServiceImpl implements ConsultationService {

    private final ConsultationNoteRepository consultationNoteRepository;
    private final AppointmentRepository appointmentRepository;

    @Override
    public ConsultationDtos.ConsultationNoteResponse createConsultation(ConsultationDtos.ConsultationNoteRequest request) {
        if (consultationNoteRepository.findByAppointmentId(request.appointmentId()).isPresent()) {
            throw new BadRequestException("Consultation note already exists for appointment");
        }
        var appointment = appointmentRepository.findWithDetailsById(request.appointmentId()).orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        ConsultationNote note = new ConsultationNote();
        note.setAppointment(appointment);
        note.setDoctor(appointment.getDoctor());
        note.setPatient(appointment.getPatient());
        note.setNotes(request.notes());
        note.setOutcome(request.outcome());
        note.setFollowUpDate(request.followUpDate());
        if (request.aiGenerated() != null) {
            note.setAiGenerated(request.aiGenerated());
            note.setReviewedAt(request.reviewedAt());
            note.setReviewedBy(request.reviewedBy());
        } else {
            note.setAiGenerated(false);
        }
        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointmentRepository.save(appointment);
        return toConsultationResponse(consultationNoteRepository.save(note));
    }

    @Override
    public List<ConsultationDtos.ConsultationNoteResponse> getPatientConsultations(Long patientId) {
        return consultationNoteRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream().map(this::toConsultationResponse).toList();
    }

    @Override
    public ConsultationDtos.ConsultationNoteResponse getConsultationByAppointmentId(Long appointmentId) {
        return consultationNoteRepository.findByAppointmentId(appointmentId)
                .map(this::toConsultationResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found"));
    }

    private ConsultationDtos.ConsultationNoteResponse toConsultationResponse(ConsultationNote note) {
        return new ConsultationDtos.ConsultationNoteResponse(
                note.getId(), note.getAppointment().getId(), note.getDoctor().getUser().getFullName(),
                note.getPatient().getUser().getFullName(), note.getNotes(), note.getOutcome(), note.getFollowUpDate(),
                note.getAiGenerated(), note.getReviewedAt(), note.getReviewedBy()
        );
    }
}
