package com.telecareplus.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class NotificationService {

    public void sendSms(String to, String message) {
        // Mock actual API call for SMS
        log.info("Sending Twilio SMS to {}: {}", to, message);
    }

    public void sendEmail(String to, String subject, String body) {
        // Mock actual API call for Email
        log.info("Sending Email to {} with subject '{}': {}", to, subject, body);
    }
}
