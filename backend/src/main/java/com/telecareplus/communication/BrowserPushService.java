package com.telecareplus.communication;

import com.telecareplus.communication.PushDtos;

public interface BrowserPushService {
    PushDtos.PublicKeyResponse getPublicKey();
    PushDtos.SubscriptionResponse saveSubscription(String username, PushDtos.SubscriptionRequest request);
    void removeSubscription(String username, PushDtos.UnsubscribeRequest request);
}
