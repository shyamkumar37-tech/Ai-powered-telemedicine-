package com.telecareplus.service;

import com.telecareplus.dto.PushDtos;

public interface BrowserPushService {
    PushDtos.PublicKeyResponse getPublicKey();
    PushDtos.SubscriptionResponse saveSubscription(String username, PushDtos.SubscriptionRequest request);
    void removeSubscription(String username, PushDtos.UnsubscribeRequest request);
}
