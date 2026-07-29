package com.telecareplus.users;

import com.telecareplus.users.DoctorDtos;
import java.util.List;

public interface DoctorService {
    List<DoctorDtos.DoctorSummaryResponse> getAllDoctors();
    DoctorDtos.DoctorDetailsResponse getDoctor(long doctorId);
}
