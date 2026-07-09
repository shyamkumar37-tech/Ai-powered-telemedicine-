package com.telecareplus.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import com.telecareplus.service.impl.DeliveryTrackerService;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/pharmacy")
@PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR')")
@RequiredArgsConstructor
public class PharmacyController {

    private final DeliveryTrackerService deliveryTrackerService;

    @PostMapping("/order")
    public ResponseEntity<Map<String, Object>> placeOrder(@RequestBody Map<String, Object> payload) {
        Long prescriptionId = payload.get("prescriptionId") != null ? Long.valueOf(payload.get("prescriptionId").toString()) : null;
        
        // Start live tracking
        String orderId = deliveryTrackerService.startTrackingOrder(prescriptionId);
        
        return ResponseEntity.ok(Map.of(
            "orderId", orderId,
            "status", "DISPATCHED",
            "estimatedDelivery", LocalDateTime.now().plusMinutes(45).toString(),
            "driverLocation", Map.of("lat", 40.7128, "lng", -74.0060) // NYC default
        ));
    }
    
    @GetMapping("/order/{orderId}/track")
    public ResponseEntity<Map<String, Object>> trackOrder(@PathVariable String orderId) {
        // Fallback for REST polling if websockets are not used
        double lat = 40.7128 + (Math.random() * 0.01 - 0.005);
        double lng = -74.0060 + (Math.random() * 0.01 - 0.005);
        
        return ResponseEntity.ok(Map.of(
            "orderId", orderId,
            "status", "ON_THE_WAY",
            "driverLocation", Map.of("lat", lat, "lng", lng)
        ));
    }
}
