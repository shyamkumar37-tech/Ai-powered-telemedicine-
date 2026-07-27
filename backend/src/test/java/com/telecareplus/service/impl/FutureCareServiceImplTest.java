package com.telecareplus.service.impl;

import com.telecareplus.dto.FutureCareDtos;
import com.telecareplus.entity.Patient;
import com.telecareplus.entity.PatientObservation;
import com.telecareplus.event.EventPublisher;
import com.telecareplus.event.VitalLoggedEvent;
import com.telecareplus.repository.PatientObservationRepository;
import com.telecareplus.repository.PatientRepository;
import com.telecareplus.service.VitalThresholdService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FutureCareServiceImplTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private PatientObservationRepository patientObservationRepository;

    @Mock
    private VitalThresholdService vitalThresholdService;

    @Mock
    private EventPublisher eventPublisher;

    @InjectMocks
    private FutureCareServiceImpl futureCareService;

    @Test
    void testCreateObservationCritical() {
        Patient patient = new Patient();
        patient.setId(1L);
        com.telecareplus.entity.User user = new com.telecareplus.entity.User();
        user.setFullName("John Doe");
        patient.setUser(user);
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        
        FutureCareDtos.ObservationRequest request = new FutureCareDtos.ObservationRequest(
                1L, null, com.telecareplus.entity.enums.ObservationSource.MANUAL_UPLOAD, "vital", "heart rate", "130", "bpm", false, "Feeling dizzy", null
        );

        when(vitalThresholdService.isCritical("heart rate", "130")).thenReturn(true);
        when(patientObservationRepository.save(any(PatientObservation.class))).thenAnswer(i -> {
            PatientObservation obs = i.getArgument(0);
            obs.setId(100L);
            return obs;
        });

        futureCareService.createObservation(request);

        verify(patientObservationRepository).save(argThat(obs -> obs.isAbnormalFlag()));
        verify(eventPublisher).publishVitalLogged(any(VitalLoggedEvent.class));
    }

    @Test
    void testCreateObservationNormal() {
        Patient patient = new Patient();
        patient.setId(1L);
        com.telecareplus.entity.User user = new com.telecareplus.entity.User();
        user.setFullName("John Doe");
        patient.setUser(user);
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        
        FutureCareDtos.ObservationRequest request = new FutureCareDtos.ObservationRequest(
                1L, null, com.telecareplus.entity.enums.ObservationSource.MANUAL_UPLOAD, "vital", "heart rate", "80", "bpm", false, "Normal", null
        );

        when(vitalThresholdService.isCritical("heart rate", "80")).thenReturn(false);
        when(patientObservationRepository.save(any(PatientObservation.class))).thenAnswer(i -> {
            PatientObservation obs = i.getArgument(0);
            obs.setId(101L);
            return obs;
        });

        futureCareService.createObservation(request);

        verify(patientObservationRepository).save(argThat(obs -> !obs.isAbnormalFlag()));
        verify(eventPublisher, never()).publishVitalLogged(any(VitalLoggedEvent.class));
    }
}
