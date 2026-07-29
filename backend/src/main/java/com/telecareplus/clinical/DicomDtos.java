package com.telecareplus.clinical;

public class DicomDtos {

    public record UploadDicomRequest(
            Long patientId,
            String modality,
            String studyDescription,
            String wadoUrl
    ) {}

    public record DicomStudyResponse(
            Long id,
            Long patientId,
            String studyInstanceUid,
            String seriesInstanceUid,
            String modality,
            String studyDescription,
            String wadoUrl,
            String studyDate
    ) {}
}
