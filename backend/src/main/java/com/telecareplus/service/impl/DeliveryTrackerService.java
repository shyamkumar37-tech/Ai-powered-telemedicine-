package com.telecareplus.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeliveryTrackerService {

    private final SimpMessagingTemplate messagingTemplate;

    // In a real app, this would be persisted in DB.
    // Map of orderId to current coordinates {lat, lng}
    private final Map<String, Location> activeDeliveries = new ConcurrentHashMap<>();

    private static class Location {
        double lat;
        double lng;
        
        Location(double lat, double lng) {
            this.lat = lat;
            this.lng = lng;
        }
    }

    public String startTrackingOrder(Long prescriptionId) {
        String orderId = UUID.randomUUID().toString();
        // Start somewhere around NYC
        activeDeliveries.put(orderId, new Location(40.7128, -74.0060));
        return orderId;
    }

    @Scheduled(fixedRate = 2000)
    public void broadcastLocations() {
        for (Map.Entry<String, Location> entry : activeDeliveries.entrySet()) {
            String orderId = entry.getKey();
            Location loc = entry.getValue();

            // Simulate movement towards a random destination
            loc.lat += (Math.random() * 0.001 - 0.0002);
            loc.lng += (Math.random() * 0.001 - 0.0002);

            Map<String, Object> payload = Map.of(
                "orderId", orderId,
                "lat", loc.lat,
                "lng", loc.lng,
                "status", "OUT_FOR_DELIVERY"
            );

            messagingTemplate.convertAndSend("/topic/delivery/" + orderId, payload);
        }
    }
}
