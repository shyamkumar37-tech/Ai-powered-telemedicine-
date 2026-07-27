package com.telecareplus.service.impl;

import com.telecareplus.entity.MedicationItem;
import com.telecareplus.entity.MedicationReminder;
import com.telecareplus.entity.Patient;
import com.telecareplus.entity.enums.AlertSeverity;
import com.telecareplus.entity.enums.ReminderStatus;
import com.telecareplus.repository.MedicationReminderRepository;
import com.telecareplus.event.EventPublisher;
import com.telecareplus.event.MedicationMissedEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReminderServiceImplTest {

    @Mock
    private MedicationReminderRepository medicationReminderRepository;

    @Mock
    private EventPublisher eventPublisher;

    @InjectMocks
    private ReminderServiceImpl reminderService;

    @Test
    void testSweepForMissedMedications() {
        Patient patient = new Patient();
        patient.setId(101L);

        MedicationItem item = new MedicationItem();
        item.setMedicineName("Lisinopril");

        MedicationReminder reminder = new MedicationReminder();
        reminder.setId(1L);
        reminder.setPatient(patient);
        reminder.setMedicationItem(item);
        reminder.setStatus(ReminderStatus.PENDING);
        reminder.setScheduledDate(LocalDate.now().minusDays(1));

        when(medicationReminderRepository.findByStatusAndScheduledDateBefore(eq(ReminderStatus.PENDING), any(LocalDate.class)))
                .thenReturn(List.of(reminder));

        reminderService.sweepForMissedMedications();

        verify(medicationReminderRepository, times(1)).save(reminder);
        verify(eventPublisher, times(1)).publishMedicationMissed(any(MedicationMissedEvent.class));
    }
}
