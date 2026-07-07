package com.telecareplus.controller;

import com.telecareplus.dto.IvrDtos;
import com.telecareplus.service.IvrService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ivr")
@RequiredArgsConstructor
public class IvrController {

    private final IvrService ivrService;

    @PostMapping("/sessions")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #request.patientId())")
    public IvrDtos.SessionResponse start(@Valid @RequestBody IvrDtos.StartSessionRequest request) {
        return ivrService.startSession(request);
    }

    @GetMapping("/patient/{patientId}/sessions")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public List<IvrDtos.SessionResponse> history(@PathVariable Long patientId) {
        return ivrService.getPatientSessions(patientId);
    }
}
