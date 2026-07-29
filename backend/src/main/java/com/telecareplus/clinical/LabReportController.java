package com.telecareplus.clinical;

import com.telecareplus.users.Patient;

import com.telecareplus.users.PatientRepository;
import com.telecareplus.common.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Tag(name = "Laboratory & Immunization", description = "Endpoints for Lab Results, Diagnostics, and Vaccination Records")
@RestController
@RequestMapping("/api/clinical/labs")
@RequiredArgsConstructor
public class LabReportController {

    private final LabReportRepository labReportRepository;
    private final VaccinationRecordRepository vaccinationRecordRepository;
    private final PatientRepository patientRepository;

    @Operation(summary = "Record Diagnostic Lab Result")
    @PostMapping("/reports")
    public ResponseEntity<LabDtos.LabReportResponse> recordLabReport(@RequestBody LabDtos.CreateLabReportRequest request) {
        var patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        LabReport report = new LabReport();
        report.setPatient(patient);
        report.setTestName(request.testName());
        report.setLoincCode(request.loincCode());
        report.setResultValue(request.resultValue());
        report.setReferenceRange(request.referenceRange());
        report.setAttachmentUrl(request.attachmentUrl());
        report = labReportRepository.save(report);

        return ResponseEntity.ok(toLabReportResponse(report));
    }

    @Operation(summary = "Get Patient Lab Reports")
    @GetMapping("/reports")
    public ResponseEntity<List<LabDtos.LabReportResponse>> getLabReports(@RequestParam Long patientId) {
        List<LabReport> reports = labReportRepository.findByPatientIdOrderByReportedAtDesc(patientId);
        return ResponseEntity.ok(reports.stream().map(this::toLabReportResponse).toList());
    }

    @Operation(summary = "Record Immunization / Vaccination Entry")
    @PostMapping("/vaccinations")
    public ResponseEntity<LabDtos.VaccinationResponse> recordVaccination(@RequestBody LabDtos.CreateVaccinationRequest request) {
        var patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        VaccinationRecord record = new VaccinationRecord();
        record.setPatient(patient);
        record.setVaccineName(request.vaccineName());
        record.setBatchNumber(request.batchNumber());
        record.setCvxCode(request.cvxCode());
        if (request.boosterDueDate() != null && !request.boosterDueDate().isBlank()) {
            record.setBoosterDueDate(LocalDate.parse(request.boosterDueDate()));
        }
        record.setAdministratorName(request.administratorName());
        record = vaccinationRecordRepository.save(record);

        return ResponseEntity.ok(toVaccinationResponse(record));
    }

    @Operation(summary = "Get Patient Vaccination Records")
    @GetMapping("/vaccinations")
    public ResponseEntity<List<LabDtos.VaccinationResponse>> getVaccinations(@RequestParam Long patientId) {
        List<VaccinationRecord> records = vaccinationRecordRepository.findByPatientIdOrderByAdministeredDateDesc(patientId);
        return ResponseEntity.ok(records.stream().map(this::toVaccinationResponse).toList());
    }

    private LabDtos.LabReportResponse toLabReportResponse(LabReport report) {
        return new LabDtos.LabReportResponse(
                report.getId(),
                report.getPatient().getId(),
                report.getTestName(),
                report.getLoincCode(),
                report.getResultValue(),
                report.getReferenceRange(),
                report.getStatus(),
                report.getAttachmentUrl(),
                report.getReportedAt() != null ? report.getReportedAt().toString() : null
        );
    }

    private LabDtos.VaccinationResponse toVaccinationResponse(VaccinationRecord record) {
        return new LabDtos.VaccinationResponse(
                record.getId(),
                record.getPatient().getId(),
                record.getVaccineName(),
                record.getBatchNumber(),
                record.getCvxCode(),
                record.getAdministeredDate() != null ? record.getAdministeredDate().toString() : null,
                record.getBoosterDueDate() != null ? record.getBoosterDueDate().toString() : null,
                record.getAdministratorName()
        );
    }
}
