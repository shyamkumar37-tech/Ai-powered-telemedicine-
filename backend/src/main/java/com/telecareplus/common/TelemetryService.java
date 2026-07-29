package com.telecareplus.common;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TelemetryService {
    private final SimpMessagingTemplate messagingTemplate;

    @Scheduled(fixedRate = 1000)
    public void pushVitals() {
        messagingTemplate.convertAndSend("/topic/vitals", "{\"heartRate\": 75, \"spo2\": 98}");
    }
}
