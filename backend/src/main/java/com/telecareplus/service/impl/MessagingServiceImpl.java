package com.telecareplus.service.impl;

import com.telecareplus.dto.MessageDtos;
import com.telecareplus.entity.CareMessage;
import com.telecareplus.entity.Caregiver;
import com.telecareplus.entity.Doctor;
import com.telecareplus.entity.Patient;
import com.telecareplus.entity.Pharmacist;
import com.telecareplus.entity.User;
import com.telecareplus.exception.BadRequestException;
import com.telecareplus.exception.ResourceNotFoundException;
import com.telecareplus.repository.AppointmentRepository;
import com.telecareplus.repository.CareMessageRepository;
import com.telecareplus.repository.CaregiverRepository;
import com.telecareplus.repository.DoctorRepository;
import com.telecareplus.repository.DispenseRecordRepository;
import com.telecareplus.repository.PatientCaregiverLinkRepository;
import com.telecareplus.repository.PatientRepository;
import com.telecareplus.repository.PharmacistRepository;
import com.telecareplus.repository.UserRepository;
import com.telecareplus.service.MessagingService;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MessagingServiceImpl implements MessagingService {

    private final CareMessageRepository careMessageRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final CaregiverRepository caregiverRepository;
    private final PharmacistRepository pharmacistRepository;
    private final PatientCaregiverLinkRepository linkRepository;
    private final AppointmentRepository appointmentRepository;
    private final DispenseRecordRepository dispenseRecordRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public MessageDtos.MessageInboxResponse getPatientInbox(Long patientId) {
        Patient patient = requirePatient(patientId);
        return new MessageDtos.MessageInboxResponse(buildPatientContacts(patient), toMessageResponses(careMessageRepository.findByPatientIdOrderByCreatedAtDesc(patientId)));
    }

    @Override
    public MessageDtos.MessageInboxResponse getDoctorInbox(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId).orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
        return new MessageDtos.MessageInboxResponse(buildDoctorContacts(doctor), toMessageResponses(careMessageRepository.findBySenderUserIdOrRecipientUserIdOrderByCreatedAtDesc(doctor.getUser().getId(), doctor.getUser().getId())));
    }

    @Override
    public MessageDtos.MessageInboxResponse getCaregiverInbox(Long caregiverId) {
        Caregiver caregiver = caregiverRepository.findById(caregiverId).orElseThrow(() -> new ResourceNotFoundException("Caregiver not found"));
        return new MessageDtos.MessageInboxResponse(buildCaregiverContacts(caregiver), toMessageResponses(careMessageRepository.findBySenderUserIdOrRecipientUserIdOrderByCreatedAtDesc(caregiver.getUser().getId(), caregiver.getUser().getId())));
    }

    @Override
    public MessageDtos.MessageInboxResponse getPharmacistInbox(Long pharmacistId) {
        Pharmacist pharmacist = pharmacistRepository.findById(pharmacistId).orElseThrow(() -> new ResourceNotFoundException("Pharmacist not found"));
        return new MessageDtos.MessageInboxResponse(buildPharmacistContacts(pharmacist), toMessageResponses(careMessageRepository.findBySenderUserIdOrRecipientUserIdOrderByCreatedAtDesc(pharmacist.getUser().getId(), pharmacist.getUser().getId())));
    }

    @Override
    public MessageDtos.MessageResponse sendMessage(MessageDtos.MessageRequest request) {
        if (request.body() != null && request.body().length() > MessageDtos.MAX_BODY_LENGTH) {
            throw new BadRequestException("Message body must be at most " + MessageDtos.MAX_BODY_LENGTH + " characters");
        }
        Patient patient = requirePatient(request.patientId());
        User sender = userRepository.findById(request.senderUserId()).orElseThrow(() -> new ResourceNotFoundException("Sender not found"));
        User recipient = userRepository.findById(request.recipientUserId()).orElseThrow(() -> new ResourceNotFoundException("Recipient not found"));

        CareMessage message = new CareMessage();
        message.setPatient(patient);
        message.setSenderUser(sender);
        message.setRecipientUser(recipient);
        message.setSubject(request.subject());
        message.setBody(request.body());
        message.setAcknowledged(false);
        
        MessageDtos.MessageResponse response = toMessageResponse(careMessageRepository.save(message));
        
        // Push to real-time STOMP queue
        messagingTemplate.convertAndSendToUser(
                recipient.getId().toString(),
                "/queue/messages",
                response
        );
        
        return response;
    }

    @Override
    public MessageDtos.MessageResponse acknowledgeMessage(Long messageId) {
        CareMessage message = careMessageRepository.findById(messageId).orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        message.setAcknowledged(true);
        message.setReadAt(LocalDateTime.now());
        return toMessageResponse(careMessageRepository.save(message));
    }

    private Patient requirePatient(Long patientId) {
        return patientRepository.findById(patientId).orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
    }

    private List<MessageDtos.ContactResponse> buildPatientContacts(Patient patient) {
        Map<Long, MessageDtos.ContactResponse> contacts = new LinkedHashMap<>();
        appointmentRepository.findByPatientIdOrderByAppointmentDateTimeDesc(patient.getId()).forEach(appointment -> {
            Doctor doctor = appointment.getDoctor();
            contacts.putIfAbsent(
                    doctor.getUser().getId(),
                    new MessageDtos.ContactResponse(doctor.getUser().getId(), doctor.getId(), doctor.getUser().getRole(), doctor.getUser().getFullName(), doctor.getSpecialization())
            );
        });
        linkRepository.findByPatientIdAndActiveTrue(patient.getId()).forEach(link -> {
            Caregiver caregiver = link.getCaregiver();
            contacts.putIfAbsent(
                    caregiver.getUser().getId(),
                    new MessageDtos.ContactResponse(caregiver.getUser().getId(), caregiver.getId(), caregiver.getUser().getRole(), caregiver.getUser().getFullName(), caregiver.getRelationshipLabel())
            );
        });
        pharmacistRepository.findAll().forEach(pharmacist -> contacts.putIfAbsent(
                pharmacist.getUser().getId(),
                new MessageDtos.ContactResponse(pharmacist.getUser().getId(), pharmacist.getId(), pharmacist.getUser().getRole(), pharmacist.getUser().getFullName(), pharmacist.getFacilityName())
        ));
        return contacts.values().stream().toList();
    }

    private List<MessageDtos.ContactResponse> buildDoctorContacts(Doctor doctor) {
        Map<Long, MessageDtos.ContactResponse> contacts = new LinkedHashMap<>();
        appointmentRepository.findByDoctorIdOrderByAppointmentDateTimeDesc(doctor.getId()).forEach(appointment -> {
            Patient patient = appointment.getPatient();
            contacts.putIfAbsent(
                    patient.getUser().getId(),
                    new MessageDtos.ContactResponse(patient.getUser().getId(), patient.getId(), patient.getUser().getRole(), patient.getUser().getFullName(), appointment.getConcernSummary())
            );
        });
        return contacts.values().stream().toList();
    }

    private List<MessageDtos.ContactResponse> buildCaregiverContacts(Caregiver caregiver) {
        Map<Long, MessageDtos.ContactResponse> contacts = new LinkedHashMap<>();
        linkRepository.findByCaregiverIdAndActiveTrue(caregiver.getId()).forEach(link -> {
            Patient patient = link.getPatient();
            contacts.putIfAbsent(
                    patient.getUser().getId(),
                    new MessageDtos.ContactResponse(patient.getUser().getId(), patient.getId(), patient.getUser().getRole(), patient.getUser().getFullName(), patient.getDiseases())
            );
        });
        return contacts.values().stream().toList();
    }

    private List<MessageDtos.ContactResponse> buildPharmacistContacts(Pharmacist pharmacist) {
        Map<Long, MessageDtos.ContactResponse> contacts = new LinkedHashMap<>();
        dispenseRecordRepository.findByPharmacistIdOrderByCreatedAtDesc(pharmacist.getId()).forEach(record -> {
            Patient patient = record.getPatient();
            contacts.putIfAbsent(
                    patient.getUser().getId(),
                    new MessageDtos.ContactResponse(patient.getUser().getId(), patient.getId(), patient.getUser().getRole(), patient.getUser().getFullName(), record.getStatus().name())
            );
        });
        return contacts.values().stream().toList();
    }

    private List<MessageDtos.MessageResponse> toMessageResponses(List<CareMessage> messages) {
        return messages.stream().map(this::toMessageResponse).toList();
    }

    private MessageDtos.MessageResponse toMessageResponse(CareMessage message) {
        return new MessageDtos.MessageResponse(
                message.getId(),
                message.getPatient().getId(),
                message.getPatient().getUser().getFullName(),
                message.getSenderUser().getId(),
                message.getSenderUser().getFullName(),
                message.getSenderUser().getRole(),
                message.getRecipientUser().getId(),
                message.getRecipientUser().getFullName(),
                message.getRecipientUser().getRole(),
                message.getSubject(),
                message.getBody(),
                message.isAcknowledged(),
                message.getReadAt(),
                message.getCreatedAt()
        );
    }
}
