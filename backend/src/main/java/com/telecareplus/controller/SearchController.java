package com.telecareplus.controller;

import com.telecareplus.entity.elasticsearch.PatientDocument;
import com.telecareplus.repository.elasticsearch.PatientSearchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

@RestController
@ConditionalOnProperty(name = "spring.data.elasticsearch.repositories.enabled", havingValue = "true", matchIfMissing = true)
@RequestMapping("/api/search")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'CAREGIVER', 'PHARMACIST', 'ADMIN')")
public class SearchController {

    private final PatientSearchRepository searchRepository;

    @GetMapping("/patients")
    public ResponseEntity<List<PatientDocument>> searchPatients(@RequestParam String query) {
        // Fallback or basic implementation: search across multiple fields
        List<PatientDocument> results = searchRepository.findByFullNameContainingOrMedicalHistorySummaryContaining(query, query);
        return ResponseEntity.ok(results);
    }
}
