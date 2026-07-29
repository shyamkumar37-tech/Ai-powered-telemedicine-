package com.telecareplus.communication;

import lombok.Data;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class SignalingController {

    private static final Logger logger = LoggerFactory.getLogger(SignalingController.class);
    private final SimpMessagingTemplate messagingTemplate;

    public SignalingController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/signal")
    public void processSignal(@Payload WebRTCSignal signal, Principal principal) {
        if (principal == null) {
            logger.warn("Unauthenticated signaling attempt");
            return;
        }
        
        // Ensure sender matches authenticated user to prevent spoofing
        signal.setSenderId(principal.getName());
        
        logger.debug("Routing WebRTC signal {} from {} to {}", signal.getType(), signal.getSenderId(), signal.getRecipientId());
        
        messagingTemplate.convertAndSendToUser(
                signal.getRecipientId(),
                "/queue/webrtc",
                signal
        );
    }

    @Data
    public static class WebRTCSignal {
        private String type;
        private String senderId;
        private String recipientId;
        private Object data;
    }
}
