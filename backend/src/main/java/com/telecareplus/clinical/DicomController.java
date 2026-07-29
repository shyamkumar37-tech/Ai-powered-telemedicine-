package com.telecareplus.clinical;

import com.telecareplus.users.Patient;

import com.telecareplus.users.PatientRepository;
import com.telecareplus.common.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "DICOM Medical Imaging", description = "Endpoints for PACS DICOM Medical Scans and WADO-RS Visualizer Metadata")
@RestController
@RequestMapping("/api/clinical/dicom")
@RequiredArgsConstructor
public class DicomController {

    private final DicomStudyRepository dicomRepository;
    private final PatientRepository patientRepository;

    @Operation(summary = "Register DICOM Imaging Study")
    @PostMapping("/studies")
    public ResponseEntity<DicomDtos.DicomStudyResponse> registerStudy(@RequestBody DicomDtos.UploadDicomRequest request) {
        var patient = patientRepository.findById(request.patientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        DicomStudy study = new DicomStudy();
        study.setPatient(patient);
        study.setStudyInstanceUid("1.2.840.10008.5.1.4.1.1." + UUID.randomUUID().toString().replace("-", ""));
        study.setSeriesInstanceUid("1.2.840.10008.5.1.4.1.2." + UUID.randomUUID().toString().replace("-", ""));
        study.setModality(request.modality() != null ? request.modality() : "CT");
        study.setStudyDescription(request.studyDescription());
        study.setWadoUrl(request.wadoUrl());
        study = dicomRepository.save(study);

        return ResponseEntity.ok(toDicomResponse(study));
    }

    @Operation(summary = "Get DICOM Studies for Patient")
    @GetMapping("/studies")
    public ResponseEntity<List<DicomDtos.DicomStudyResponse>> getStudies(@RequestParam Long patientId) {
        List<DicomStudy> studies = dicomRepository.findByPatientIdOrderByStudyDateDesc(patientId);
        return ResponseEntity.ok(studies.stream().map(this::toDicomResponse).toList());
    }

    private DicomDtos.DicomStudyResponse toDicomResponse(DicomStudy study) {
        return new DicomDtos.DicomStudyResponse(
                study.getId(),
                study.getPatient().getId(),
                study.getStudyInstanceUid(),
                study.getSeriesInstanceUid(),
                study.getModality(),
                study.getStudyDescription(),
                study.getWadoUrl(),
                study.getStudyDate() != null ? study.getStudyDate().toString() : null
        );
    }
}
