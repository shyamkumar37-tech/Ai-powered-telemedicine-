package com.telecareplus.clinical;

import com.telecareplus.clinical.Geofence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GeofenceRepository extends JpaRepository<Geofence, Long> {
    Optional<Geofence> findByPatientId(Long patientId);
}
