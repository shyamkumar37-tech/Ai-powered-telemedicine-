package com.telecareplus.pharmacy;

import com.telecareplus.pharmacy.ReminderDtos;
import java.util.List;

public interface ReminderService {
    List<ReminderDtos.ReminderResponse> getPatientReminders(Long patientId);
    ReminderDtos.ReminderResponse updateReminderStatus(Long reminderId, ReminderDtos.ReminderStatusRequest request);
    ReminderDtos.AdherenceSummaryResponse getAdherenceSummary(Long patientId);
}
