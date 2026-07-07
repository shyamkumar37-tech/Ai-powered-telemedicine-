package com.telecareplus.controller;

import com.telecareplus.dto.MessageDtos;
import com.telecareplus.service.MessagingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessagingService messagingService;

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
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','CAREGIVER','PHARMACIST') and @accessScopeAuthorizer.canSendPatientMessage(authentication, #request.patientId(), #request.senderUserId())")
    public MessageDtos.MessageResponse send(@Valid @RequestBody MessageDtos.MessageRequest request) {
        return messagingService.sendMessage(request);
    }

    @PatchMapping("/{messageId}/acknowledge")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','CAREGIVER','PHARMACIST') and @accessScopeAuthorizer.canAccessMessage(authentication, #messageId)")
    public MessageDtos.MessageResponse acknowledge(@PathVariable Long messageId) {
        return messagingService.acknowledgeMessage(messageId);
    }
}
