package com.telecareplus.controller;

import com.telecareplus.dto.SignalingMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class WebRtcSignalingController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/peer/offer")
    public void handleOffer(@Payload SignalingMessage message) {
        messagingTemplate.convertAndSendToUser(message.getTargetId(), "/queue/webrtc/offer", message);
    }

    @MessageMapping("/peer/answer")
    public void handleAnswer(@Payload SignalingMessage message) {
        messagingTemplate.convertAndSendToUser(message.getTargetId(), "/queue/webrtc/answer", message);
    }

    @MessageMapping("/peer/ice-candidate")
    public void handleIceCandidate(@Payload SignalingMessage message) {
        messagingTemplate.convertAndSendToUser(message.getTargetId(), "/queue/webrtc/ice-candidate", message);
    }
}
