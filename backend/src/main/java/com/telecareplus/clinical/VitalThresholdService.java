package com.telecareplus.clinical;

import org.springframework.stereotype.Service;

@Service
public class VitalThresholdService {

    public boolean isCritical(String vitalType, String valueStr) {
        if (vitalType == null || valueStr == null || valueStr.trim().isEmpty()) {
            return false;
        }

        try {
            double value = Double.parseDouble(valueStr);
            return switch (vitalType.toLowerCase()) {
                case "heart rate", "heart_rate", "hr" -> value < 50 || value > 120;
                case "blood pressure systolic", "blood_pressure_systolic", "bp_systolic" -> value < 90 || value > 180;
                case "blood pressure diastolic", "blood_pressure_diastolic", "bp_diastolic" -> value < 60 || value > 120;
                case "spo2", "oxygen saturation" -> value < 90;
                case "temperature", "body temperature" -> value < 95.0 || value > 103.0; // Assuming F
                default -> false;
            };
        } catch (NumberFormatException e) {
            // Can't parse numeric, might be qualitative like Blood Pressure "120/80"
            if (vitalType.toLowerCase().contains("blood pressure") && valueStr.contains("/")) {
                try {
                    String[] parts = valueStr.split("/");
                    double systolic = Double.parseDouble(parts[0].trim());
                    double diastolic = Double.parseDouble(parts[1].trim());
                    return systolic < 90 || systolic > 180 || diastolic < 60 || diastolic > 120;
                } catch (Exception ex) {
                    return false; // Safely ignore unparseable
                }
            }
            return false;
        }
    }
}
