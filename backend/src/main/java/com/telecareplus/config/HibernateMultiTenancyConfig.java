package com.telecareplus.config;

import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.boot.autoconfigure.orm.jpa.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class HibernateMultiTenancyConfig {

    private final CurrentTenantIdentifierResolver<String> currentTenantIdentifierResolver;

    public HibernateMultiTenancyConfig(CurrentTenantIdentifierResolver<String> currentTenantIdentifierResolver) {
        this.currentTenantIdentifierResolver = currentTenantIdentifierResolver;
    }

    @Bean
    public HibernatePropertiesCustomizer hibernatePropertiesCustomizer() {
        return hibernateProperties -> {
            hibernateProperties.put("hibernate.tenant_identifier_resolver", currentTenantIdentifierResolver);
        };
    }
}
