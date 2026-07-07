package com.telecareplus.service.impl;

import com.telecareplus.config.AppProperties;
import com.telecareplus.dto.PushDtos;
import com.telecareplus.entity.BrowserPushSubscription;
import com.telecareplus.exception.BadRequestException;
import com.telecareplus.exception.ResourceNotFoundException;
import com.telecareplus.repository.BrowserPushSubscriptionRepository;
import com.telecareplus.repository.UserRepository;
import com.telecareplus.service.BrowserPushService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BrowserPushServiceImpl implements BrowserPushService {

    private final AppProperties appProperties;
    private final BrowserPushSubscriptionRepository browserPushSubscriptionRepository;
    private final UserRepository userRepository;

    @Override
    public PushDtos.PublicKeyResponse getPublicKey() {
        return new PushDtos.PublicKeyResponse(isConfigured(), appProperties.getIntegrations().getPush().getPublicKey(), appProperties.getIntegrations().getPush().getSubject());
    }

    @Override
    @Transactional
    public PushDtos.SubscriptionResponse saveSubscription(String username, PushDtos.SubscriptionRequest request) {
        if (!isConfigured()) {
            throw new BadRequestException("Browser push is not configured");
        }

        var user = userRepository.findByEmail(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        BrowserPushSubscription subscription = browserPushSubscriptionRepository.findByEndpoint(request.endpoint())
                .orElseGet(BrowserPushSubscription::new);
        subscription.setUser(user);
        subscription.setEndpoint(request.endpoint());
        subscription.setPublicKey(request.keys().p256dh());
        subscription.setAuthSecret(request.keys().auth());
        subscription.setExpirationTime(request.expirationTime());
        subscription.setUserAgent(request.userAgent());
        subscription.setActive(true);

        subscription = browserPushSubscriptionRepository.save(subscription);
        return toResponse(subscription);
    }

    @Override
    @Transactional
    public void removeSubscription(String username, PushDtos.UnsubscribeRequest request) {
        var user = userRepository.findByEmail(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        browserPushSubscriptionRepository.findByUserIdAndEndpoint(user.getId(), request.endpoint())
                .ifPresent(subscription -> {
                    subscription.setActive(false);
                    browserPushSubscriptionRepository.save(subscription);
                });
    }

    private boolean isConfigured() {
        AppProperties.Channel push = appProperties.getIntegrations().getPush();
        if (!push.isEnabled()) {
            return false;
        }

        String provider = push.getProvider();
        boolean providerMatches = provider != null
                && ("browser".equalsIgnoreCase(provider) || "webpush".equalsIgnoreCase(provider));

        return providerMatches
                && push.getPublicKey() != null && !push.getPublicKey().isBlank()
                && push.getPrivateKey() != null && !push.getPrivateKey().isBlank()
                && push.getSubject() != null && !push.getSubject().isBlank();
    }

    private PushDtos.SubscriptionResponse toResponse(BrowserPushSubscription subscription) {
        return new PushDtos.SubscriptionResponse(
                subscription.getId(),
                subscription.getEndpoint(),
                subscription.isActive(),
                subscription.getUpdatedAt()
        );
    }
}
