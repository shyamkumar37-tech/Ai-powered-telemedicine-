package com.telecareplus.repository;

import com.telecareplus.entity.BrowserPushSubscription;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BrowserPushSubscriptionRepository extends JpaRepository<BrowserPushSubscription, Long> {
    Optional<BrowserPushSubscription> findByEndpoint(String endpoint);
    Optional<BrowserPushSubscription> findByUserIdAndEndpoint(Long userId, String endpoint);
    List<BrowserPushSubscription> findByUserIdAndActiveTrue(Long userId);
}
