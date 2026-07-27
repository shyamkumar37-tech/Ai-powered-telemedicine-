package com.telecareplus.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.PropertySource;

import java.util.HashMap;
import java.util.Map;

public class ElasticsearchConditionPostProcessor implements EnvironmentPostProcessor {

    private static final String PROPERTY_ES_ENABLED = "spring.data.elasticsearch.repositories.enabled";
    private static final String PROPERTY_AUTOCONFIGURE_EXCLUDE = "spring.autoconfigure.exclude";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String esEnabled = environment.getProperty(PROPERTY_ES_ENABLED);
        
        // If explicitly set to false
        if ("false".equalsIgnoreCase(esEnabled)) {
            String currentExcludes = environment.getProperty(PROPERTY_AUTOCONFIGURE_EXCLUDE, "");
            
            String newExcludes = String.join(",",
                "org.springframework.boot.autoconfigure.elasticsearch.ElasticsearchDataAutoConfiguration",
                "org.springframework.boot.autoconfigure.data.elasticsearch.ElasticsearchRepositoriesAutoConfiguration",
                "org.springframework.boot.autoconfigure.elasticsearch.ElasticsearchRestClientAutoConfiguration",
                "org.springframework.boot.actuate.autoconfigure.elasticsearch.ElasticsearchRestHealthContributorAutoConfiguration"
            );
            
            if (!currentExcludes.isEmpty()) {
                newExcludes = currentExcludes + "," + newExcludes;
            }
            
            Map<String, Object> additionalProperties = new HashMap<>();
            additionalProperties.put(PROPERTY_AUTOCONFIGURE_EXCLUDE, newExcludes);
            
            PropertySource<?> propertySource = new MapPropertySource("elasticsearchExclusionProperties", additionalProperties);
            environment.getPropertySources().addFirst(propertySource);
        }
    }
}
