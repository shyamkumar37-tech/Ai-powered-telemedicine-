package com.telecareplus.communication;

import com.telecareplus.common.BaseEntity;
import com.telecareplus.users.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(
        name = "browser_push_subscriptions",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_browser_push_endpoint", columnNames = "endpoint")
        }
)
public class BrowserPushSubscription extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String endpoint;

    @Column(nullable = false, name = "public_key")
    private String publicKey;

    @Column(nullable = false, name = "auth_secret")
    private String authSecret;

    @Column(name = "expiration_time")
    private Long expirationTime;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(nullable = false)
    private boolean active = true;
}
