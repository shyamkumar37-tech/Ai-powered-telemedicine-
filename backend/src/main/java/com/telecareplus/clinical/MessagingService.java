package com.telecareplus.clinical;

import com.telecareplus.clinical.MessageDtos;
import java.util.List;

public interface MessagingService {
    // New generic chat endpoints
    List<MessageDtos.ChatConversationResponse> getConversations(Long userId);
    List<MessageDtos.ChatMessageResponse> getConversationHistory(Long conversationId, Long userId);
    MessageDtos.ChatMessageResponse sendChatMessage(Long senderId, MessageDtos.ChatMessageRequest request);
    void markConversationAsRead(Long conversationId, Long userId);

    // Legacy endpoints (kept for backwards compatibility if needed during migration)
    MessageDtos.MessageInboxResponse getPatientInbox(Long patientId);
    MessageDtos.MessageInboxResponse getDoctorInbox(Long doctorId);
    MessageDtos.MessageInboxResponse getCaregiverInbox(Long caregiverId);
    MessageDtos.MessageInboxResponse getPharmacistInbox(Long pharmacistId);
    MessageDtos.MessageResponse sendMessage(MessageDtos.MessageRequest request);
    MessageDtos.MessageResponse acknowledgeMessage(Long messageId);
}
