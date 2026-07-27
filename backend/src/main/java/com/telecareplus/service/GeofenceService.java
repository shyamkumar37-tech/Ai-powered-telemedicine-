package com.telecareplus.service;

import com.telecareplus.entity.Geofence;
import com.telecareplus.repository.GeofenceRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class GeofenceService {
    private final GeofenceRepository repository;

    public GeofenceService(GeofenceRepository repository) {
        this.repository = repository;
    }

    public Geofence createOrUpdateGeofence(Geofence geofence) {
        return repository.save(geofence);
    }

    public Optional<Geofence> getGeofenceForPatient(Long patientId) {
        return repository.findByPatientId(patientId);
    }
}
