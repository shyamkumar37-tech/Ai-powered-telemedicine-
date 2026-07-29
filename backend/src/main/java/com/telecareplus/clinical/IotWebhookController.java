package com.telecareplus.clinical;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/iot")
@RequiredArgsConstructor
@Slf4j
public class IotWebhookController {

    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping("/webhooks")
    public ResponseEntity<Void> receiveIotData(@RequestBody Map<String, Object> payload) {
        log.info("Received IoT webhook payload: {}", payload);
        
        Object deviceId = payload.get("deviceId");
        if (deviceId != null) {
            String destination = "/topic/iot/telemetry/" + deviceId.toString();
            messagingTemplate.convertAndSend(destination, payload);
            log.info("Broadcasted IoT data to {}", destination);
        } else {
            log.warn("Received IoT data without deviceId");
        }
        
        return ResponseEntity.ok().build();
    }
}
