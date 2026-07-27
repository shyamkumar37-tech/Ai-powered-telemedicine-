package com.telecareplus.service.communication;

import com.telecareplus.entity.Caregiver;
import com.telecareplus.entity.Patient;
import com.telecareplus.entity.User;
import com.telecareplus.entity.enums.AlertSeverity;
import java.util.List;

public interface CommunicationService {
    OtpDispatchResult dispatchLoginOtp(User user, String otp, long ttlSeconds);
    List<DeliveryReceipt> dispatchAlertNotifications(Patient patient, List<Caregiver> caregivers, AlertSeverity severity, String message, String referenceId);
    void sendEmail(String to, String subject, String body);
}
