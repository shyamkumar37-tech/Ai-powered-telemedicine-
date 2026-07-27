package com.telecareplus.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventPublisher {

    private final ApplicationEventPublisher applicationEventPublisher;

    public void publishMedicationMissed(MedicationMissedEvent event) {
        log.info("Publishing MedicationMissedEvent for patient {}", event.patientId());
        applicationEventPublisher.publishEvent(event);
    }

    public void publishVitalLogged(VitalLoggedEvent event) {
        log.info("Publishing VitalLoggedEvent for patient {} (critical={})", event.patientId(), event.isCritical());
        applicationEventPublisher.publishEvent(event);
    }
}
