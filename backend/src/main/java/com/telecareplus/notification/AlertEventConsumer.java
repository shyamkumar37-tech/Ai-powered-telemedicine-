package com.telecareplus.notification;

import com.telecareplus.common.VitalLoggedEvent;

import com.telecareplus.pharmacy.MedicationMissedEvent;

import com.telecareplus.common.AlertSeverity;
import com.telecareplus.notification.AlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertEventConsumer {

    private final AlertService alertService;

    @EventListener
    public void handleMedicationMissed(MedicationMissedEvent event) {
        log.info("Received MedicationMissedEvent for patient {}", event.patientId());
        
        alertService.createAlert(
                event.patientId(),
                AlertSeverity.WARNING,
                "Missed medication: " + event.medicationName()
        );
    }

    @EventListener
    public void handleVitalLogged(VitalLoggedEvent event) {
        log.info("Received VitalLoggedEvent for patient {}", event.patientId());
        
        if (event.isCritical()) {
            alertService.createAlert(
                    event.patientId(),
                    AlertSeverity.CRITICAL,
                    "CRITICAL VITAL: " + event.vitalType() + " = " + event.value() + " " + event.unit()
            );
        }
    }
}
