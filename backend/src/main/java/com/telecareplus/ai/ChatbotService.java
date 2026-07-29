package com.telecareplus.ai;

import com.telecareplus.ai.ChatbotDtos;
import java.util.List;

public interface ChatbotService {
    List<ChatbotDtos.ChatResponse> getHistory(Long patientId);
    ChatbotDtos.ChatResponse ask(ChatbotDtos.ChatRequest request);
}
