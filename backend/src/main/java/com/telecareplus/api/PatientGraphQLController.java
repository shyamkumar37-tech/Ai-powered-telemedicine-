package com.telecareplus.api;

import com.telecareplus.users.PatientRepository;
import com.telecareplus.clinical.HealthRecordRepository;
import com.telecareplus.users.Patient;
import com.telecareplus.clinical.HealthRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class PatientGraphQLController {

    private final PatientRepository patientRepository;
    private final HealthRecordRepository healthRecordRepository;

    public record PatientGraphQLDto(
            Long id,
            String fullName,
            String email,
            Boolean active
    ) {}

    public record HealthRecordGraphQLDto(
            Long id,
            String bloodPressure,
            Double sugar,
            Double spo2,
            Double pulse,
            Double temperature,
            String recordedAt
    ) {}

    @QueryMapping
    public PatientGraphQLDto patientProfile(@Argument Long id) {
        return patientRepository.findById(id)
                .map(p -> new PatientGraphQLDto(
                        p.getId(),
                        p.getUser() != null ? p.getUser().getFullName() : "Patient",
                        p.getUser() != null ? p.getUser().getEmail() : "",
                        p.getUser() != null && p.getUser().isActive()
                ))
                .orElse(null);
    }

    @QueryMapping
    public List<HealthRecordGraphQLDto> patientHealthRecords(@Argument Long patientId) {
        List<HealthRecord> records = healthRecordRepository.findByPatientIdOrderByRecordedAtDesc(patientId);
        return records.stream()
                .map(r -> new HealthRecordGraphQLDto(
                        r.getId(),
                        r.getBloodPressure(),
                        r.getSugar(),
                        r.getSpo2(),
                        r.getPulse(),
                        r.getTemperature(),
                        r.getRecordedAt() != null ? r.getRecordedAt().toString() : null
                ))
                .toList();
    }
}
