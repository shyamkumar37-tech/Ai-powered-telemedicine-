package com.telecareplus.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;


import com.telecareplus.entity.AdministrationRecord;
import com.telecareplus.entity.Geofence;
import com.telecareplus.entity.MedicationSchedule;
import com.telecareplus.entity.PriorAuthorization;
import com.telecareplus.service.EMarService;
import com.telecareplus.service.GeofenceService;
import com.telecareplus.service.PriorAuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "AdvancedFeatures", description = "Endpoints for AdvancedFeatures management")
@RestController
@RequestMapping("/api/advanced")
@RequiredArgsConstructor
public class AdvancedFeaturesController {

    private final GeofenceService geofenceService;
    private final EMarService eMarService;
    private final PriorAuthorizationService priorAuthorizationService;

    // Geofencing
    @Operation(summary = "Create Geofence", description = "Create a geofence")
    @ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/geofence")
    public ResponseEntity<Geofence> createGeofence(@RequestBody Geofence geofence) {
        return ResponseEntity.ok(geofenceService.createOrUpdateGeofence(geofence));
    }

    @Operation(summary = "Get Geofence", description = "Get a geofence")
    @ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/geofence/{patientId}")
    public ResponseEntity<Geofence> getGeofence(@PathVariable Long patientId) {
        return geofenceService.getGeofenceForPatient(patientId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // eMAR
    @Operation(summary = "Create Schedule", description = "Create a schedule")
    @ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/emar/schedule")
    public ResponseEntity<MedicationSchedule> createSchedule(@RequestBody MedicationSchedule schedule) {
        return ResponseEntity.ok(eMarService.createSchedule(schedule));
    }

    @Operation(summary = "Get Schedules", description = "Get schedules")
    @ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/emar/schedule/{patientId}")
    public ResponseEntity<List<MedicationSchedule>> getSchedules(@PathVariable Long patientId) {
        return ResponseEntity.ok(eMarService.getPatientSchedules(patientId));
    }

    @Operation(summary = "Record Administration", description = "Record administration")
    @ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/emar/record")
    public ResponseEntity<AdministrationRecord> recordAdministration(@RequestBody AdministrationRecord record) {
        return ResponseEntity.ok(eMarService.recordAdministration(record));
    }

    @Operation(summary = "Get Records", description = "Get records")
    @ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/emar/record/{scheduleId}")
    public ResponseEntity<List<AdministrationRecord>> getRecords(@PathVariable Long scheduleId) {
        return ResponseEntity.ok(eMarService.getRecordsForSchedule(scheduleId));
    }

    // Prior Authorization
    @Operation(summary = "Submit Prior Auth", description = "Submit prior auth")
    @ApiResponse(responseCode = "200", description = "Successful operation")
    @PostMapping("/prior-auth")
    public ResponseEntity<PriorAuthorization> submitPriorAuth(@RequestBody PriorAuthorization auth) {
        return ResponseEntity.ok(priorAuthorizationService.submitAuthorization(auth));
    }

    @Operation(summary = "Get Prior Auths", description = "Get prior auths")
    @ApiResponse(responseCode = "200", description = "Successful operation")
    @GetMapping("/prior-auth/{patientId}")
    public ResponseEntity<List<PriorAuthorization>> getPriorAuths(@PathVariable Long patientId) {
        return ResponseEntity.ok(priorAuthorizationService.getAuthorizationsForPatient(patientId));
    }
}
