package com.telecareplus.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ImagingAnalysisService {
    public String analyzeImage(MultipartFile file) {
        return "{\"boundingBoxes\": []}";
    }
}
