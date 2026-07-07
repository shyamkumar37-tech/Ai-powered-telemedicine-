package com.telecareplus.service.impl;

import com.telecareplus.dto.HealthDtos;
import com.telecareplus.entity.HealthRecord;
import com.telecareplus.entity.enums.AlertSeverity;
import com.telecareplus.exception.ResourceNotFoundException;
import com.telecareplus.repository.HealthRecordRepository;
import com.telecareplus.repository.PatientRepository;
import com.telecareplus.service.AlertService;
import com.telecareplus.service.HealthRecordService;
import com.telecareplus.util.MapperUtil;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class HealthRecordServiceImpl implements HealthRecordService {

    private final PatientRepository patientRepository;
    private final HealthRecordRepository healthRecordRepository;
    private final AlertService alertService;

    @Override
    public HealthDtos.HealthRecordResponse createRecord(HealthDtos.HealthRecordRequest request) {
        var patient = patientRepository.findById(request.patientId()).orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        HealthRecord record = new HealthRecord();
        record.setPatient(patient);
        record.setBloodPressure(request.bloodPressure());
        record.setSugar(request.sugar());
        record.setWeight(request.weight());
        record.setSpo2(request.spo2());
        record.setPulse(request.pulse());
        record.setTemperature(request.temperature());
        record.setRecordedAt(LocalDateTime.now());

        AlertSeverity severity = AlertSeverity.INFO;
        String message = "Readings within expected telemonitoring range.";
        if ((request.spo2() != null && request.spo2() < 90) || (request.temperature() != null && request.temperature() >= 103) || (request.sugar() != null && request.sugar() > 320)) {
            severity = AlertSeverity.CRITICAL;
            message = "Immediate in-person medical attention recommended based on dangerous health readings.";
        } else if ((request.spo2() != null && request.spo2() < 94) || (request.sugar() != null && request.sugar() > 220) || (request.pulse() != null && (request.pulse() < 50 || request.pulse() > 120))) {
            severity = AlertSeverity.WARNING;
            message = "Abnormal health trend detected. Priority doctor review advised.";
        }
        record.setAlertSeverity(severity);
        record.setAlertMessage(message);
        record = healthRecordRepository.save(record);

        if (severity != AlertSeverity.INFO) {
            alertService.createAlert(patient.getId(), severity, message);
        }
        return MapperUtil.toHealthResponse(record);
    }

    @Override
    public List<HealthDtos.HealthRecordResponse> getPatientRecords(Long patientId) {
        return healthRecordRepository.findByPatientIdOrderByRecordedAtDesc(patientId).stream().map(MapperUtil::toHealthResponse).toList();
    }

    @Override
    public HealthDtos.HealthTrendSummaryResponse getTrendSummary(Long patientId) {
        var latestRecords = healthRecordRepository.findSummaryRowsByPatientId(patientId, PageRequest.of(0, 10));
        if (latestRecords.isEmpty()) {
            return new HealthDtos.HealthTrendSummaryResponse(0, null, null, "NO_DATA", null, null, null, null, null);
        }

        var latest = latestRecords.get(0);
        var previous = latestRecords.size() > 1 ? latestRecords.get(1) : null;
        Double averagePulse = latestRecords.stream()
                .map(HealthRecordRepository.HealthSummaryRow::getPulse)
                .filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);

        String sugarTrend = "STABLE";
        if (latest.getSugar() != null && previous != null && previous.getSugar() != null) {
            if (latest.getSugar() > previous.getSugar() + 10) {
                sugarTrend = "RISING";
            } else if (latest.getSugar() < previous.getSugar() - 10) {
                sugarTrend = "IMPROVING";
            }
        }

        return new HealthDtos.HealthTrendSummaryResponse(
                latestRecords.size(),
                latest.getSugar(),
                previous != null ? previous.getSugar() : null,
                sugarTrend,
                latest.getSpo2(),
                averagePulse,
                latest.getBloodPressure(),
                latest.getAlertSeverity(),
                latest.getAlertMessage()
        );
    }
}
