package com.telecareplus.communication;

import com.telecareplus.communication.OtpDispatchResult;
import com.telecareplus.communication.DeliveryReceipt;

import com.telecareplus.users.Caregiver;
import com.telecareplus.users.Patient;
import com.telecareplus.users.User;
import com.telecareplus.common.AlertSeverity;
import java.util.List;

public interface CommunicationService {
    OtpDispatchResult dispatchLoginOtp(User user, String otp, long ttlSeconds);
    List<DeliveryReceipt> dispatchAlertNotifications(Patient patient, List<Caregiver> caregivers, AlertSeverity severity, String message, String referenceId);
    void sendEmail(String to, String subject, String body);
}
