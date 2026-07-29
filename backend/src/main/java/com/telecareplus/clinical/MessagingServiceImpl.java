package com.telecareplus.clinical;

import com.telecareplus.clinical.MessageDtos;
import com.telecareplus.clinical.CareMessage;
import com.telecareplus.users.Caregiver;
import com.telecareplus.communication.ChatMessage;
import com.telecareplus.communication.Conversation;
import com.telecareplus.users.Doctor;
import com.telecareplus.users.Patient;
import com.telecareplus.users.Pharmacist;
import com.telecareplus.users.User;
import com.telecareplus.common.BadRequestException;
import com.telecareplus.common.ResourceNotFoundException;
import com.telecareplus.appointments.AppointmentRepository;
import com.telecareplus.clinical.CareMessageRepository;
import com.telecareplus.users.CaregiverRepository;
import com.telecareplus.communication.ChatMessageRepository;
import com.telecareplus.communication.ConversationRepository;
import com.telecareplus.pharmacy.DispenseRecordRepository;
import com.telecareplus.users.DoctorRepository;
import com.telecareplus.users.PatientCaregiverLinkRepository;
import com.telecareplus.users.PatientRepository;
import com.telecareplus.users.PharmacistRepository;
import com.telecareplus.users.UserRepository;
import com.telecareplus.clinical.MessagingService;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MessagingServiceImpl implements MessagingService {

    private final CareMessageRepository careMessageRepository;
    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
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
    @Transactional(readOnly = true)
    public List<MessageDtos.ChatConversationResponse> getConversations(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        // 1. Get existing conversations
        List<Conversation> conversations = conversationRepository.findByUserIdOrderByLastMessageAtDesc(userId);
        
        // 2. Build map of contactUserId -> ChatConversationResponse from existing conversations
        Map<Long, MessageDtos.ChatConversationResponse> responseMap = new LinkedHashMap<>();
        for (Conversation c : conversations) {
            User contact = c.getUser1().getId().equals(userId) ? c.getUser2() : c.getUser1();
            long unreadCount = chatMessageRepository.countUnreadMessages(c.getId(), userId);
            
            List<ChatMessage> messages = chatMessageRepository.findByConversationIdOrderByCreatedAtAsc(c.getId());
            String lastMessage = "Started a conversation";
            if (!messages.isEmpty()) {
                lastMessage = messages.get(messages.size() - 1).getContent();
            }
            
            responseMap.put(contact.getId(), new MessageDtos.ChatConversationResponse(
                    c.getId(),
                    contact.getId(),
                    contact.getFullName(),
                    contact.getRole().name(),
                    lastMessage,
                    c.getLastMessageAt(),
                    unreadCount
            ));
        }
        
        // 3. Get all valid contacts for this user role
        List<MessageDtos.ContactResponse> validContacts = new ArrayList<>();
        switch (user.getRole()) {
            case PATIENT -> patientRepository.findByUserId(userId).ifPresent(p -> validContacts.addAll(buildPatientContacts(p)));
            case DOCTOR -> doctorRepository.findByUserId(userId).ifPresent(d -> validContacts.addAll(buildDoctorContacts(d)));
            case CAREGIVER -> caregiverRepository.findByUserId(userId).ifPresent(c -> validContacts.addAll(buildCaregiverContacts(c)));
            case PHARMACIST -> pharmacistRepository.findByUserId(userId).ifPresent(p -> validContacts.addAll(buildPharmacistContacts(p)));
            default -> {} // ADMIN doesn't have a specific contact builder yet
        }
        
        // 4. Merge contacts that don't have conversations yet
        for (MessageDtos.ContactResponse contact : validContacts) {
            if (!responseMap.containsKey(contact.userId())) {
                responseMap.put(contact.userId(), new MessageDtos.ChatConversationResponse(
                        null, // no conversation id yet
                        contact.userId(),
                        contact.displayName(),
                        contact.role().name(),
                        "Started a conversation",
                        LocalDateTime.now(), // default to now so it sorts properly, or null
                        0
                ));
            }
        }
        
        // 5. Sort by lastMessageAt descending
        List<MessageDtos.ChatConversationResponse> results = new ArrayList<>(responseMap.values());
        results.sort((a, b) -> {
            if (a.lastMessageAt() == null && b.lastMessageAt() == null) return 0;
            if (a.lastMessageAt() == null) return 1;
            if (b.lastMessageAt() == null) return -1;
            return b.lastMessageAt().compareTo(a.lastMessageAt());
        });
        
        return results;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageDtos.ChatMessageResponse> getConversationHistory(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
                
        if (!conversation.getUser1().getId().equals(userId) && !conversation.getUser2().getId().equals(userId)) {
            throw new BadRequestException("You do not have access to this conversation");
        }
        
        return chatMessageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId).stream()
                .map(m -> new MessageDtos.ChatMessageResponse(
                        m.getId(),
                        m.getConversation().getId(),
                        m.getSender().getId(),
                        m.getContent(),
                        m.getCreatedAt(),
                        m.getReadAt()
                )).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MessageDtos.ChatMessageResponse sendChatMessage(Long senderId, MessageDtos.ChatMessageRequest request) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));
        User recipient = userRepository.findById(request.recipientId())
                .orElseThrow(() -> new ResourceNotFoundException("Recipient not found"));
                
        if (senderId.equals(request.recipientId())) {
            throw new BadRequestException("Cannot send message to yourself");
        }

        Conversation conversation;
        if (request.conversationId() != null) {
            conversation = conversationRepository.findById(request.conversationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        } else {
            // Find existing or create new
            conversation = conversationRepository.findByUser1IdAndUser2Id(senderId, recipient.getId())
                    .orElseGet(() -> {
                        Conversation c = new Conversation();
                        c.setUser1(sender);
                        c.setUser2(recipient);
                        c.setLastMessageAt(LocalDateTime.now());
                        return conversationRepository.save(c);
                    });
        }
        
        conversation.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setConversation(conversation);
        chatMessage.setSender(sender);
        chatMessage.setContent(request.content());
        chatMessage = chatMessageRepository.save(chatMessage);
        
        MessageDtos.ChatMessageResponse response = new MessageDtos.ChatMessageResponse(
                chatMessage.getId(),
                conversation.getId(),
                sender.getId(),
                chatMessage.getContent(),
                chatMessage.getCreatedAt(),
                null
        );

        // Real-time push
        messagingTemplate.convertAndSendToUser(
                recipient.getEmail(),
                "/queue/messages",
                response
        );

        return response;
    }

    @Override
    @Transactional
    public void markConversationAsRead(Long conversationId, Long userId) {
        chatMessageRepository.markAsReadByConversationAndUserId(conversationId, userId);
    }

    // --- Legacy methods kept for backward compatibility during migration ---

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
        
        return toMessageResponse(careMessageRepository.save(message));
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
