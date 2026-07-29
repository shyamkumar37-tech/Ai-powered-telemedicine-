package com.telecareplus.clinical;

import com.telecareplus.clinical.HealthDtos;
import com.telecareplus.clinical.HealthRecordService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/health-records")
@RequiredArgsConstructor
public class HealthRecordController {

    private final HealthRecordService healthRecordService;

    @PostMapping
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #request.patientId())")
    public HealthDtos.HealthRecordResponse create(@Valid @RequestBody HealthDtos.HealthRecordRequest request) {
        return healthRecordService.createRecord(request);
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("(hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)) or hasRole('DOCTOR')")
    public List<HealthDtos.HealthRecordResponse> list(@PathVariable Long patientId) {
        return healthRecordService.getPatientRecords(patientId);
    }

    @GetMapping("/patient/{patientId}/summary")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public HealthDtos.HealthTrendSummaryResponse summary(@PathVariable Long patientId) {
        return healthRecordService.getTrendSummary(patientId);
    }
}
