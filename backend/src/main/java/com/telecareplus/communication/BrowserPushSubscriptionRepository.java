package com.telecareplus.communication;

import com.telecareplus.communication.BrowserPushSubscription;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BrowserPushSubscriptionRepository extends JpaRepository<BrowserPushSubscription, Long> {
    Optional<BrowserPushSubscription> findByEndpoint(String endpoint);
    Optional<BrowserPushSubscription> findByUserIdAndEndpoint(Long userId, String endpoint);
    List<BrowserPushSubscription> findByUserIdAndActiveTrue(Long userId);
}
