package com.telecareplus.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class CareMessage extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(optional = false)
    @JoinColumn(name = "sender_user_id", nullable = false)
    private User senderUser;

    @ManyToOne(optional = false)
    @JoinColumn(name = "recipient_user_id", nullable = false)
    private User recipientUser;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false, length = 2000)
    private String body;

    @Column(nullable = false)
    private boolean acknowledged;

    private LocalDateTime readAt;
}
