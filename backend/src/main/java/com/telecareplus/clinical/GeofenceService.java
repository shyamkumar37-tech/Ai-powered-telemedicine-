package com.telecareplus.clinical;

import com.telecareplus.clinical.Geofence;
import com.telecareplus.clinical.GeofenceRepository;
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
