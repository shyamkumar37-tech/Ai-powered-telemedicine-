package com.telecareplus.service;

import com.telecareplus.entity.PriorAuthorization;
import com.telecareplus.repository.PriorAuthorizationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PriorAuthorizationService {
    private final PriorAuthorizationRepository repository;

    public PriorAuthorizationService(PriorAuthorizationRepository repository) {
        this.repository = repository;
    }

    public PriorAuthorization submitAuthorization(PriorAuthorization authorization) {
        authorization.setStatus("PENDING");
        return repository.save(authorization);
    }

    public List<PriorAuthorization> getAuthorizationsForPatient(Long patientId) {
        return repository.findByPatientId(patientId);
    }
}
