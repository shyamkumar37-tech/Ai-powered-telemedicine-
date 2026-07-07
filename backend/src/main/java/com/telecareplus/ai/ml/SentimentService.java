package com.telecareplus.ai.ml;

import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SentimentService {

    private final HfInferenceClient hfInferenceClient;

    @Value("${telecare.ml.sentiment.enabled:false}")
    private boolean enabled;

    public Optional<HfInferenceClient.SentimentResult> analyze(String text) {
        if (!enabled) {
            return Optional.empty();
        }
        return hfInferenceClient.analyzeSentiment(text);
    }
}
