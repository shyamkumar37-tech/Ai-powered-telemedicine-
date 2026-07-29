package com.telecareplus.notification;

import com.telecareplus.common.AlertSeverity;
import com.telecareplus.users.Caregiver;
import com.telecareplus.users.Patient;
import java.util.List;

/**
 * Event published when an alert is created, to decouple notification -> communication dependency.
 */
public record AlertNotificationEvent(
    Patient patient,
    List<Caregiver> caregivers,
    AlertSeverity severity,
    String message,
    String referenceId
) {}
