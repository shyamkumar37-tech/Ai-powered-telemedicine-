package com.telecareplus.ai;

import com.telecareplus.ai.ChatbotDtos;
import com.telecareplus.ai.ChatbotService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #patientId)")
    public List<ChatbotDtos.ChatResponse> history(@PathVariable long patientId, Authentication authentication) {
        return chatbotService.getHistory(patientId);
    }

    @PostMapping("/ask")
    @PreAuthorize("hasRole('PATIENT') and @accessScopeAuthorizer.canAccessPatient(authentication, #request.patientId())")
    public ChatbotDtos.ChatResponse ask(@Valid @RequestBody ChatbotDtos.ChatRequest request, Authentication authentication) {
        return chatbotService.ask(new ChatbotDtos.ChatRequest(request.patientId(), request.question()));
    }
}
