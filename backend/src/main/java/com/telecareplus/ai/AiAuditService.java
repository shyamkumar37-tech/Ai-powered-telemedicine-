package com.telecareplus.ai;

import com.telecareplus.ai.AiAuditEvent;
import com.telecareplus.ai.AiAuditEventRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AiAuditService {

    private final AiAuditEventRepository repository;

    public void recordEvent(String featureKey, Long patientId, Long userId, List<String> rationale, String inputSummary, String outputSummary, String riskLevel) {
        AiAuditEvent event = new AiAuditEvent();
        event.setFeatureKey(featureKey);
        event.setPatientId(patientId);
        event.setUserId(userId);
        event.setRationale(rationale == null ? null : String.join(" | ", rationale));
        event.setInputSummary(inputSummary);
        event.setOutputSummary(outputSummary);
        event.setRiskLevel(riskLevel);
        repository.save(event);
    }
}
