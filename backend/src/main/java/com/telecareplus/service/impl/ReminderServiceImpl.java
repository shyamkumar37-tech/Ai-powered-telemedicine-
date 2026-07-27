package com.telecareplus.service.impl;

import com.telecareplus.dto.ReminderDtos;
import com.telecareplus.entity.enums.ReminderStatus;
import com.telecareplus.exception.ResourceNotFoundException;
import com.telecareplus.repository.MedicationReminderRepository;
import com.telecareplus.service.ReminderService;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.telecareplus.event.EventPublisher;
import com.telecareplus.event.MedicationMissedEvent;
import com.telecareplus.entity.enums.AlertSeverity;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReminderServiceImpl implements ReminderService {

    private final MedicationReminderRepository medicationReminderRepository;
    private final EventPublisher eventPublisher;

    @Override
    public List<ReminderDtos.ReminderResponse> getPatientReminders(Long patientId) {
        LocalDate today = LocalDate.now();
        return medicationReminderRepository.findByPatientIdOrderByScheduledDateDesc(patientId)
                .stream()
                .map(reminder -> toReminderResponse(reminder, resolveEffectiveStatus(reminder, today)))
                .toList();
    }

    @Override
    public ReminderDtos.ReminderResponse updateReminderStatus(Long reminderId, ReminderDtos.ReminderStatusRequest request) {
        var reminder = medicationReminderRepository.findById(reminderId).orElseThrow(() -> new ResourceNotFoundException("Reminder not found"));
        reminder.setStatus(request.status());
        var saved = medicationReminderRepository.save(reminder);
        return toReminderResponse(saved, saved.getStatus());
    }

    @Override
    public ReminderDtos.AdherenceSummaryResponse getAdherenceSummary(Long patientId) {
        LocalDate today = LocalDate.now();
        var counts = medicationReminderRepository.summarizeAdherence(patientId, today);
        long taken = counts.getTaken();
        long missed = counts.getMissed();
        long total = taken + missed;

        double percentage = total == 0 ? 0.0 : (taken * 100.0) / total;
        return new ReminderDtos.AdherenceSummaryResponse(total, taken, missed, Math.round(percentage * 100.0) / 100.0);
    }

    private ReminderStatus resolveEffectiveStatus(com.telecareplus.entity.MedicationReminder reminder, LocalDate today) {
        if (reminder.getStatus() != ReminderStatus.PENDING) {
            return reminder.getStatus();
        }

        LocalDate scheduled = reminder.getScheduledDate();
        if (scheduled == null) {
            return ReminderStatus.PENDING;
        }

        return scheduled.isBefore(today) ? ReminderStatus.MISSED : ReminderStatus.PENDING;
    }

    private ReminderDtos.ReminderResponse toReminderResponse(com.telecareplus.entity.MedicationReminder reminder, ReminderStatus status) {
        return new ReminderDtos.ReminderResponse(
                reminder.getId(),
                reminder.getMedicationItem().getMedicineName(),
                reminder.getMedicationItem().getDosage(),
                reminder.getMedicationItem().getFrequency(),
                reminder.getScheduledDate(),
                status
        );
    }

    @Scheduled(fixedRate = 60000)
    public void sweepForMissedMedications() {
        LocalDate today = LocalDate.now();
        List<com.telecareplus.entity.MedicationReminder> pastDue = medicationReminderRepository.findByStatusAndScheduledDateBefore(ReminderStatus.PENDING, today);
        if (!pastDue.isEmpty()) {
            log.info("Found {} past-due pending reminders. Marking as MISSED and publishing events.", pastDue.size());
            for (com.telecareplus.entity.MedicationReminder reminder : pastDue) {
                reminder.setStatus(ReminderStatus.MISSED);
                medicationReminderRepository.save(reminder);
                eventPublisher.publishMedicationMissed(new MedicationMissedEvent(
                        reminder.getPatient().getId(),
                        reminder.getId(),
                        reminder.getMedicationItem().getMedicineName(),
                        reminder.getScheduledDate()
                ));
            }
        }
    }
}
