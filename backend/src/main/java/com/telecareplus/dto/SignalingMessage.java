package com.telecareplus.dto;

import lombok.Data;

@Data
public class SignalingMessage {
    private String type;
    private String sdp;
    private String candidate;
    private String senderId;
    private String targetId;
    private String roomId;
}
