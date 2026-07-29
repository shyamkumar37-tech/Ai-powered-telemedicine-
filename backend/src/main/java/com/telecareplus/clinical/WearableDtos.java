package com.telecareplus.clinical;

import java.util.List;

/**
 * Data Transfer Objects for Wearable Device & IoT Telemetry Stream Ingestion.
 */
public class WearableDtos {

    public record VitalTelemetrySample(
            String deviceId,
            String deviceType, // e.g. "APPLE_WATCH", "FITBIT_SENSE", "DEXCOM_G7"
            Double systolicBp,
            Double diastolicBp,
            Integer heartRate,
            Double spo2,
            Double glucoseMgDl,
            Double temperatureCelsius,
            String timestamp
    ) {}

    public record BulkTelemetryIngestRequest(
            Long patientId,
            List<VitalTelemetrySample> samples
    ) {}

    public record IngestResponse(
            int processedCount,
            int anomalyCount,
            String status
    ) {}
}
