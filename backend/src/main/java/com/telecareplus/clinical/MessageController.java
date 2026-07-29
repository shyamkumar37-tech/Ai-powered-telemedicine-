package com.telecareplus.clinical;

import com.telecareplus.clinical.MessageDtos;
import com.telecareplus.users.CustomUserPrincipal;
import com.telecareplus.clinical.MessagingService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessagingService messagingService;

    // --- New Generic Chat Endpoints ---

    @GetMapping("/conversations")
    public List<MessageDtos.ChatConversationResponse> getConversations(@AuthenticationPrincipal CustomUserPrincipal principal) {
        return messagingService.getConversations(principal.getUserId());
    }

    @GetMapping("/conversations/{conversationId}")
    public List<MessageDtos.ChatMessageResponse> getConversationHistory(
            @PathVariable Long conversationId,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        return messagingService.getConversationHistory(conversationId, principal.getUserId());
    }

    @PostMapping("/send")
    public MessageDtos.ChatMessageResponse sendChatMessage(
            @Valid @RequestBody MessageDtos.ChatMessageRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        return messagingService.sendChatMessage(principal.getUserId(), request);
    }

    @PatchMapping("/{conversationId}/read")
    public void markConversationRead(
            @PathVariable Long conversationId,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        messagingService.markConversationAsRead(conversationId, principal.getUserId());
    }

    // --- Legacy Endpoints for Compatibility ---

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public MessageDtos.MessageInboxResponse patientInbox(@PathVariable Long patientId) {
        return messagingService.getPatientInbox(patientId);
    }

    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasRole('DOCTOR') and @accessScopeAuthorizer.canAccessDoctor(authentication, #doctorId)")
    public MessageDtos.MessageInboxResponse doctorInbox(@PathVariable Long doctorId) {
        return messagingService.getDoctorInbox(doctorId);
    }

    @GetMapping("/caregiver/{caregiverId}")
    @PreAuthorize("hasRole('CAREGIVER') and @accessScopeAuthorizer.canAccessCaregiver(authentication, #caregiverId)")
    public MessageDtos.MessageInboxResponse caregiverInbox(@PathVariable Long caregiverId) {
        return messagingService.getCaregiverInbox(caregiverId);
    }

    @GetMapping("/pharmacist/{pharmacistId}")
    @PreAuthorize("hasRole('PHARMACIST') and @accessScopeAuthorizer.canAccessPharmacist(authentication, #pharmacistId)")
    public MessageDtos.MessageInboxResponse pharmacistInbox(@PathVariable Long pharmacistId) {
        return messagingService.getPharmacistInbox(pharmacistId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','CAREGIVER','PHARMACIST') and @accessScopeAuthorizer.canSendPatientMessage(authentication, #request.patientId(), #request.senderUserId(), #request.recipientUserId())")
    public MessageDtos.MessageResponse send(@Valid @RequestBody MessageDtos.MessageRequest request) {
        return messagingService.sendMessage(request);
    }

    @PatchMapping("/{messageId}/acknowledge")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','CAREGIVER','PHARMACIST') and @accessScopeAuthorizer.canAccessMessage(authentication, #messageId)")
    public MessageDtos.MessageResponse acknowledge(@PathVariable Long messageId) {
        return messagingService.acknowledgeMessage(messageId);
    }
}
