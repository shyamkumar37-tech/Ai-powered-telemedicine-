package com.telecareplus.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "Telecare+ API Documentation",
        version = "1.0",
        description = "Comprehensive REST API for the Telecare+ Platform including Patient, Doctor, Caregiver, Pharmacist, and Admin modules.",
        contact = @Contact(name = "Telecare+ Support", email = "support@telecareplus.com")
    ),
    security = @SecurityRequirement(name = "Bearer Authentication")
)
@SecurityScheme(
    name = "Bearer Authentication",
    type = SecuritySchemeType.HTTP,
    bearerFormat = "JWT",
    scheme = "bearer",
    description = "A valid JWT token is required for all protected endpoints. Enter your token in the format: Bearer <token>"
)
public class OpenApiConfig {
    // Global OpenAPI configurations are handled via annotations above.
}
