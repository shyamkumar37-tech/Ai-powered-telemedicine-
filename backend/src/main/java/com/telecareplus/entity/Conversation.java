package com.telecareplus.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class Conversation extends BaseEntity {

    @ManyToOne(optional = false)
    @JoinColumn(name = "user1_id", nullable = false)
    private User user1;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user2_id", nullable = false)
    private User user2;

    private LocalDateTime lastMessageAt;
}
