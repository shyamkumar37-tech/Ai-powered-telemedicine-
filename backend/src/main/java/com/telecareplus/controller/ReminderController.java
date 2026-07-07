package com.telecareplus.controller;

import com.telecareplus.dto.ReminderDtos;
import com.telecareplus.service.ReminderService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reminders")
@RequiredArgsConstructor
public class ReminderController {

    private final ReminderService reminderService;

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public List<ReminderDtos.ReminderResponse> list(@PathVariable Long patientId) {
        return reminderService.getPatientReminders(patientId);
    }

    @PatchMapping("/{reminderId}/status")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessReminder(authentication, #reminderId)")
    public ReminderDtos.ReminderResponse updateStatus(@PathVariable Long reminderId, @Valid @RequestBody ReminderDtos.ReminderStatusRequest request) {
        return reminderService.updateReminderStatus(reminderId, request);
    }

    @GetMapping("/patient/{patientId}/adherence")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public ReminderDtos.AdherenceSummaryResponse adherence(@PathVariable Long patientId) {
        return reminderService.getAdherenceSummary(patientId);
    }
}
