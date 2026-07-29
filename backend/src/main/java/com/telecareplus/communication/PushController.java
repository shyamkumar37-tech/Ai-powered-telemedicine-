package com.telecareplus.communication;

import com.telecareplus.communication.PushDtos;
import com.telecareplus.communication.BrowserPushService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
public class PushController {

    private final BrowserPushService browserPushService;

    @GetMapping("/public-key")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','CAREGIVER')")
    public PushDtos.PublicKeyResponse publicKey() {
        return browserPushService.getPublicKey();
    }

    @PostMapping("/subscriptions")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','CAREGIVER')")
    public PushDtos.SubscriptionResponse subscribe(Authentication authentication, @Valid @RequestBody PushDtos.SubscriptionRequest request) {
        return browserPushService.saveSubscription(authentication.getName(), request);
    }

    @DeleteMapping("/subscriptions")
    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','CAREGIVER')")
    public void unsubscribe(Authentication authentication, @Valid @RequestBody PushDtos.UnsubscribeRequest request) {
        browserPushService.removeSubscription(authentication.getName(), request);
    }
}
