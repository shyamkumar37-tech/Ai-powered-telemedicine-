package com.telecareplus.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to mark methods that require HIPAA audit logging.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface AuditLog {
    
    /**
     * The action being performed (e.g., "VIEW_PATIENT_RECORD", "CREATE_CONSULTATION").
     */
    String action();

    /**
     * The type of resource being accessed (e.g., "PATIENT", "CONSULTATION", "PRESCRIPTION").
     */
    String resourceType();
}
