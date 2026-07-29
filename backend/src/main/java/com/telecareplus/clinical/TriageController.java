package com.telecareplus.clinical;

import com.telecareplus.clinical.TriageDtos;
import com.telecareplus.clinical.TriageService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/triage")
@RequiredArgsConstructor
public class TriageController {

    private final TriageService triageService;

    @PostMapping
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #request.patientId())")
    public TriageDtos.TriageResponse create(@Valid @RequestBody TriageDtos.TriageRequest request) {
        return triageService.createAssessment(request);
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public List<TriageDtos.TriageResponse> history(@PathVariable Long patientId) {
        return triageService.getPatientHistory(patientId);
    }
}
