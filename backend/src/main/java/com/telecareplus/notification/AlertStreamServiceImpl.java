package com.telecareplus.notification;

import com.telecareplus.notification.AlertDtos;
import com.telecareplus.notification.AlertStreamService;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class AlertStreamServiceImpl implements AlertStreamService {

    private final Map<Long, CopyOnWriteArrayList<SseEmitter>> patientEmitters = new ConcurrentHashMap<>();
    private final Map<Long, CopyOnWriteArrayList<SseEmitter>> caregiverEmitters = new ConcurrentHashMap<>();

    @Override
    public SseEmitter registerPatientStream(Long patientId) {
        return register(patientEmitters, patientId);
    }

    @Override
    public SseEmitter registerCaregiverStream(Long caregiverId) {
        return register(caregiverEmitters, caregiverId);
    }

    @Override
    public void publishToPatient(Long patientId, AlertDtos.AlertResponse alert) {
        publish(patientEmitters, patientId, alert);
    }

    @Override
    public void publishToCaregiver(Long caregiverId, AlertDtos.AlertResponse alert) {
        publish(caregiverEmitters, caregiverId, alert);
    }

    private SseEmitter register(Map<Long, CopyOnWriteArrayList<SseEmitter>> bucket, Long id) {
        SseEmitter emitter = new SseEmitter(0L);
        bucket.computeIfAbsent(id, ignored -> new CopyOnWriteArrayList<>()).add(emitter);
        emitter.onCompletion(() -> remove(bucket, id, emitter));
        emitter.onTimeout(() -> remove(bucket, id, emitter));
        emitter.onError(ex -> remove(bucket, id, emitter));
        try {
            emitter.send(SseEmitter.event().name("connected").data("connected"));
        } catch (IOException ex) {
            remove(bucket, id, emitter);
        }
        return emitter;
    }

    private void publish(Map<Long, CopyOnWriteArrayList<SseEmitter>> bucket, Long id, AlertDtos.AlertResponse alert) {
        bucket.getOrDefault(id, new CopyOnWriteArrayList<>()).forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event().name("alert").data(alert));
            } catch (IOException ex) {
                remove(bucket, id, emitter);
            }
        });
    }

    private void remove(Map<Long, CopyOnWriteArrayList<SseEmitter>> bucket, Long id, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> emitters = bucket.get(id);
        if (emitters == null) {
            return;
        }
        emitters.remove(emitter);
        if (emitters.isEmpty()) {
            bucket.remove(id);
        }
    }
}
