package com.telecareplus.ai.ml;

import com.telecareplus.entity.HealthRecord;
import com.telecareplus.repository.HealthRecordRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import smile.anomaly.IsolationForest;

@Service
@RequiredArgsConstructor
public class MlAnomalyService {

    private final HealthRecordRepository healthRecordRepository;

    @Value("${telecare.ml.anomaly.enabled:false}")
    private boolean enabled;

    public Optional<AnomalyResult> detect(Long patientId) {
        if (!enabled) {
            return Optional.empty();
        }
        List<HealthRecord> records = healthRecordRepository.findByPatientIdOrderByRecordedAtDesc(patientId);
        if (records.size() < 8) {
            return Optional.empty();
        }
        double[][] data = records.stream().limit(30).map(this::toVector).toArray(double[][]::new);
        IsolationForest forest = IsolationForest.fit(data);
        double[] scores = forest.score(data);
        double latestScore = scores[0];
        List<String> reasons = new ArrayList<>();
        if (latestScore > 0.55) {
            reasons.add("Isolation score indicates unusual vitals compared to recent history.");
        }
        if (reasons.isEmpty()) {
            reasons.add("Isolation Forest did not flag a strong anomaly in latest vitals.");
        }
        return Optional.of(new AnomalyResult(latestScore, reasons));
    }

    private double[] toVector(HealthRecord record) {
        double[] bp = parseBloodPressure(record.getBloodPressure());
        return new double[] {
                bp[0],
                bp[1],
                record.getSugar() == null ? 0.0 : record.getSugar(),
                record.getSpo2() == null ? 0.0 : record.getSpo2(),
                record.getPulse() == null ? 0.0 : record.getPulse(),
                record.getTemperature() == null ? 0.0 : record.getTemperature()
        };
    }

    private double[] parseBloodPressure(String value) {
        if (value == null || value.isBlank()) {
            return new double[]{0.0, 0.0};
        }
        String[] parts = value.split("/");
        if (parts.length < 2) {
            return new double[]{0.0, 0.0};
        }
        try {
            double systolic = Double.parseDouble(parts[0].trim());
            double diastolic = Double.parseDouble(parts[1].trim());
            return new double[]{systolic, diastolic};
        } catch (NumberFormatException ex) {
            return new double[]{0.0, 0.0};
        }
    }

    public record AnomalyResult(double score, List<String> reasons) {}
}
