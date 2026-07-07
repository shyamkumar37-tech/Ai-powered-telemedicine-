package com.telecareplus.service;

import com.telecareplus.dto.MessageDtos;

public interface MessagingService {
    MessageDtos.MessageInboxResponse getPatientInbox(Long patientId);
    MessageDtos.MessageInboxResponse getDoctorInbox(Long doctorId);
    MessageDtos.MessageInboxResponse getCaregiverInbox(Long caregiverId);
    MessageDtos.MessageInboxResponse getPharmacistInbox(Long pharmacistId);
    MessageDtos.MessageResponse sendMessage(MessageDtos.MessageRequest request);
    MessageDtos.MessageResponse acknowledgeMessage(Long messageId);
}
