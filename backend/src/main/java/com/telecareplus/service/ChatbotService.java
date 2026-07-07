package com.telecareplus.service;

import com.telecareplus.dto.ChatbotDtos;
import java.util.List;

public interface ChatbotService {
    List<ChatbotDtos.ChatResponse> getHistory(Long patientId);
    ChatbotDtos.ChatResponse ask(ChatbotDtos.ChatRequest request);
}
