package com.telecareplus.service.impl;

import com.telecareplus.dto.ConsultationDtos;
import com.telecareplus.entity.ConsultationNote;
import com.telecareplus.entity.enums.AppointmentStatus;
import com.telecareplus.exception.BadRequestException;
import com.telecareplus.exception.ResourceNotFoundException;
import com.telecareplus.repository.AppointmentRepository;
import com.telecareplus.repository.ConsultationNoteRepository;
import com.telecareplus.service.ConsultationService;
import com.telecareplus.util.MapperUtil;
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
        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointmentRepository.save(appointment);
        return MapperUtil.toConsultationResponse(consultationNoteRepository.save(note));
    }

    @Override
    public List<ConsultationDtos.ConsultationNoteResponse> getPatientConsultations(Long patientId) {
        return consultationNoteRepository.findByPatientIdOrderByCreatedAtDesc(patientId).stream().map(MapperUtil::toConsultationResponse).toList();
    }

    @Override
    public ConsultationDtos.ConsultationNoteResponse getConsultationByAppointmentId(Long appointmentId) {
        return consultationNoteRepository.findByAppointmentId(appointmentId)
                .map(MapperUtil::toConsultationResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Consultation not found"));
    }
}
