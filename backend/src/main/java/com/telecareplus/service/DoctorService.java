package com.telecareplus.service;

import com.telecareplus.dto.DoctorDtos;
import java.util.List;

public interface DoctorService {
    List<DoctorDtos.DoctorSummaryResponse> getAllDoctors();
    DoctorDtos.DoctorDetailsResponse getDoctor(long doctorId);
}
