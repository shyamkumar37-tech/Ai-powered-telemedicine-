package com.telecareplus.pharmacy;

import com.telecareplus.common.AlertSeverity;
import com.telecareplus.common.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReminderServiceImpl implements ReminderService {

    private final MedicationReminderRepository medicationReminderRepository;
    private final ApplicationEventPublisher applicationEventPublisher;



    @Override
    public List<ReminderDtos.ReminderResponse> getPatientReminders(Long patientId) {
        LocalDate today = LocalDate.now();
        return medicationReminderRepository.findByPatientIdOrderByScheduledDateDesc(patientId)
                .stream()
                .map(reminder -> toReminderResponse(reminder, resolveEffectiveStatus(reminder, today)))
                .toList();
    }

    @Override
    @Transactional
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
        double rate = total == 0 ? 0.0 : ((double) taken / total) * 100;
        return new ReminderDtos.AdherenceSummaryResponse(total, taken, missed, rate);
    }

    @Scheduled(cron = "0 0 10 * * ?") 
    @Transactional
    public void sweepForMissedMedications() {
        LocalDate today = LocalDate.now();
        List<MedicationReminder> pastDue = medicationReminderRepository.findByStatusAndScheduledDateBefore(ReminderStatus.PENDING, today);
        if (!pastDue.isEmpty()) {
            log.info("Found {} past due reminders, marking as MISSED", pastDue.size());
            for (MedicationReminder reminder : pastDue) {
                reminder.setStatus(ReminderStatus.MISSED);
                medicationReminderRepository.save(reminder);
                applicationEventPublisher.publishEvent(new MedicationMissedEvent(
                        reminder.getPatient().getId(),
                        reminder.getId(),
                        reminder.getMedicationItem().getMedicineName(),
                        reminder.getScheduledDate()
                ));
            }
        }
    }

    private ReminderDtos.ReminderResponse toReminderResponse(MedicationReminder reminder, ReminderStatus status) {
        return new ReminderDtos.ReminderResponse(
                reminder.getId(),
                reminder.getMedicationItem().getMedicineName(),
                reminder.getMedicationItem().getDosage(), 
                reminder.getMedicationItem().getFrequency(), 
                reminder.getScheduledDate(),
                status
        );
    }

    private ReminderStatus resolveEffectiveStatus(MedicationReminder reminder, LocalDate today) {
        if (reminder.getStatus() != ReminderStatus.PENDING) {
            return reminder.getStatus();
        }
        if (reminder.getScheduledDate().isBefore(today)) {
            return ReminderStatus.MISSED;
        }
        return ReminderStatus.PENDING;
    }
}
