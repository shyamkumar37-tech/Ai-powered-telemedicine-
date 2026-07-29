package com.telecareplus.clinical;

import com.telecareplus.users.Patient;
import com.telecareplus.users.PatientRepository;
import com.telecareplus.common.AlertSeverity;
import com.telecareplus.common.ResourceNotFoundException;
import com.telecareplus.common.VitalLoggedEvent;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Tag(name = "Wearable IoT Telemetry", description = "High-frequency IoT & Wearable Vital Sign Stream Ingestion")
@RestController
@RequestMapping("/api/clinical/wearables")
@RequiredArgsConstructor
public class WearableIngestionController {

    private final PatientRepository patientRepository;
    private final HealthRecordRepository healthRecordRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Operation(summary = "Ingest Bulk IoT Wearable Telemetry")
    @PostMapping("/ingest")
    public ResponseEntity<WearableDtos.IngestResponse> ingestTelemetry(@RequestBody WearableDtos.BulkTelemetryIngestRequest request) {
        var patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        int processed = 0;
        int anomalies = 0;
        List<HealthRecord> recordsToSave = new ArrayList<>();

        if (request.samples() != null) {
            for (var sample : request.samples()) {
                HealthRecord record = new HealthRecord();
                record.setPatient(patient);
                if (sample.systolicBp() != null && sample.diastolicBp() != null) {
                    record.setBloodPressure(sample.systolicBp().intValue() + "/" + sample.diastolicBp().intValue());
                }
                if (sample.heartRate() != null) {
                    record.setPulse(sample.heartRate().doubleValue());
                }
                record.setSpo2(sample.spo2());
                record.setSugar(sample.glucoseMgDl());
                record.setTemperature(sample.temperatureCelsius());
                record.setRecordedAt(LocalDateTime.now());
                
                boolean isAnomaly = (sample.spo2() != null && sample.spo2() < 90.0) ||
                                    (sample.systolicBp() != null && sample.systolicBp() > 160.0);
                
                record.setAlertSeverity(isAnomaly ? AlertSeverity.CRITICAL : AlertSeverity.INFO);
                recordsToSave.add(record);
                processed++;

                if (isAnomaly) {
                    anomalies++;
                    eventPublisher.publishEvent(new VitalLoggedEvent(
                            patient.getId(),
                            "Spo2/BP",
                            sample.spo2() != null ? String.valueOf(sample.spo2()) : String.valueOf(sample.systolicBp()),
                            sample.spo2() != null ? "%" : "mmHg",
                            LocalDateTime.now(),
                            true
                    ));
                }
            }
            if (!recordsToSave.isEmpty()) {
                healthRecordRepository.saveAll(recordsToSave);
            }
        }

        return ResponseEntity.ok(new WearableDtos.IngestResponse(
                processed,
                anomalies,
                "Telemetry stream processed successfully"
        ));
    }
}
