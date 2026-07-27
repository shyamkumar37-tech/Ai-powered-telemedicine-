package com.telecareplus.service;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class VitalThresholdServiceTest {

    private final VitalThresholdService service = new VitalThresholdService();

    @Test
    void testHeartRate() {
        assertFalse(service.isCritical("heart rate", "80"));
        assertFalse(service.isCritical("heart rate", "50"));
        assertFalse(service.isCritical("heart rate", "120"));
        
        assertTrue(service.isCritical("heart rate", "49"));
        assertTrue(service.isCritical("heart rate", "121"));
    }

    @Test
    void testBloodPressure() {
        assertFalse(service.isCritical("blood pressure", "120/80"));
        assertFalse(service.isCritical("blood pressure", "180/120"));
        assertFalse(service.isCritical("blood pressure", "90/60"));
        
        assertTrue(service.isCritical("blood pressure", "181/80"));
        assertTrue(service.isCritical("blood pressure", "120/121"));
        assertTrue(service.isCritical("blood pressure", "89/80"));
        assertTrue(service.isCritical("blood pressure", "120/59"));
    }

    @Test
    void testSpO2() {
        assertFalse(service.isCritical("spo2", "95"));
        assertFalse(service.isCritical("spo2", "90"));
        
        assertTrue(service.isCritical("spo2", "89"));
    }

    @Test
    void testTemperature() {
        assertFalse(service.isCritical("temperature", "98.6"));
        assertFalse(service.isCritical("temperature", "95.0"));
        assertFalse(service.isCritical("temperature", "103.0"));
        
        assertTrue(service.isCritical("temperature", "94.9"));
        assertTrue(service.isCritical("temperature", "103.1"));
    }

    @Test
    void testInvalidInputs() {
        assertFalse(service.isCritical("heart rate", "abc"));
        assertFalse(service.isCritical("blood pressure", "invalid"));
        assertFalse(service.isCritical("", "100"));
        assertFalse(service.isCritical(null, "100"));
        assertFalse(service.isCritical("spo2", null));
    }
}
