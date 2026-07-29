package com.telecareplus.ai;

import java.io.File;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import lombok.extern.slf4j.Slf4j;

@Configuration
@Slf4j
public class AiConfig {

    @Value("${app.ai.enabled:false}")
    private boolean aiEnabled;

    @Bean
    public VectorStore vectorStore(EmbeddingModel embeddingModel) {
        SimpleVectorStore store = new SimpleVectorStore(embeddingModel);
        File storeFile = new File("vector_store.json");
        if (storeFile.exists() && aiEnabled) {
            try {
                store.load(storeFile);
                log.info("Loaded SimpleVectorStore from {}", storeFile.getAbsolutePath());
            } catch (Exception e) {
                log.warn("Failed to load existing vector store: {}", e.getMessage());
            }
        }
        return store;
    }
}
