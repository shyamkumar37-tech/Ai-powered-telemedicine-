package com.telecareplus.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitingService {

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    public Bucket resolveBucket(String key, int capacity, int refillTokens, Duration refillDuration) {
        return cache.computeIfAbsent(key, k -> Bucket.builder()
                .addLimit(Bandwidth.builder().capacity(capacity).refillGreedy(refillTokens, refillDuration).build())
                .build());
    }

    public Bucket resolveTriageBucket(Long patientId) {
        return resolveBucket("triage_" + patientId, 10, 10, Duration.ofHours(1));
    }

    public Bucket resolveMentalHealthBucket(Long patientId) {
        return resolveBucket("mental_health_" + patientId, 30, 30, Duration.ofHours(1));
    }
}
