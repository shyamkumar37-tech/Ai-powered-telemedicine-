package com.telecareplus.ai.service;

import com.telecareplus.ai.dto.AiInsightDtos.DrugInteractionRequest;
import com.telecareplus.ai.dto.AiInsightDtos.DrugInteractionResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(MockitoExtension.class)
public class AiInsightServiceTest {

    @InjectMocks
    private AiInsightService aiInsightService;

    @Test
    void testDrugInteractions_KnownInteraction() {
        DrugInteractionRequest request = new DrugInteractionRequest(List.of("warfarin", "aspirin"));
        DrugInteractionResponse response = aiInsightService.buildDrugInteractions(request);
        
        assertEquals(1, response.warnings().size());
        assertTrue(response.warnings().get(0).startsWith("Interaction found"));
    }

    @Test
    void testDrugInteractions_NotEvaluated() {
        // Combination not in the ruleset
        DrugInteractionRequest request = new DrugInteractionRequest(List.of("lisinopril", "amlodipine"));
        DrugInteractionResponse response = aiInsightService.buildDrugInteractions(request);
        
        assertEquals(1, response.warnings().size());
        assertTrue(response.warnings().get(0).startsWith("Not evaluated"));
    }

    @Test
    void testDrugInteractions_NoInteraction() {
        // Less than 2 drugs provided
        DrugInteractionRequest request = new DrugInteractionRequest(List.of("lisinopril"));
        DrugInteractionResponse response = aiInsightService.buildDrugInteractions(request);
        
        assertEquals(1, response.warnings().size());
        assertTrue(response.warnings().get(0).startsWith("No interaction found"));
    }
}
