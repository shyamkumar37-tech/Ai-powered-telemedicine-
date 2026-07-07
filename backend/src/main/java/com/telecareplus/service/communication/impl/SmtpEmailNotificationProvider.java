package com.telecareplus.service.communication.impl;

import com.telecareplus.config.AppProperties;
import com.telecareplus.service.communication.DeliveryReceipt;
import com.telecareplus.service.communication.NotificationChannelProvider;
import com.telecareplus.service.communication.OutboundNotification;
import com.telecareplus.service.communication.OutboundNotificationChannel;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SmtpEmailNotificationProvider implements NotificationChannelProvider {

    private final AppProperties appProperties;
    private final JavaMailSender mailSender;

    @Override
    public String providerName() {
        return "smtp";
    }

    @Override
    public OutboundNotificationChannel channel() {
        return OutboundNotificationChannel.EMAIL;
    }

    @Override
    public boolean isEnabled() {
        AppProperties.Channel email = appProperties.getIntegrations().getEmail();
        return email.isEnabled()
                && "smtp".equalsIgnoreCase(email.getProvider())
                && email.getFrom() != null
                && !email.getFrom().isBlank();
    }

    @Override
    public DeliveryReceipt send(OutboundNotification notification) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(appProperties.getIntegrations().getEmail().getFrom());
        message.setTo(notification.recipient());
        message.setSubject(notification.subject());
        message.setText(notification.body());
        mailSender.send(message);
        return new DeliveryReceipt(true, channel().name(), "smtp", "Email notification dispatched via SMTP.", null);
    }
}
