import * as Sentry from "@sentry/react";
import { DynamicStateObject } from "../types/DynamicState";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || "https://mock_sentry_key@o0.ingest.sentry.io/0000000000000000";

let isSentryInitialized = false;

const PHI_SENSITIVE_KEYS = new Set([
  "name", "fullname", "patientname", "doctorname", "dob", "mrn", 
  "diagnosis", "medication", "prescriptions", "address", "phone", 
  "ssn", "vitals", "notes", "symptoms", "chathistory", "email", 
  "password", "token", "jwt", "authorization"
]);

/**
 * Recursively redacts sensitive PHI & PII values from data structures
 */
export function sanitizePhiData(data: unknown): unknown {
  if (data === null || data === undefined) return data;

  if (typeof data === "string") {
    // Redact SSN patterns, emails, phone numbers
    return data
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED-SSN]")
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[REDACTED-EMAIL]")
      .replace(/\b\+?\d{10,15}\b/g, "[REDACTED-PHONE]");
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizePhiData(item));
  }

  if (typeof data === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (PHI_SENSITIVE_KEYS.has(lowerKey)) {
        sanitized[key] = "[REDACTED-PHI]";
      } else {
        sanitized[key] = sanitizePhiData(value);
      }
    }
    return sanitized;
  }

  return data;
}

/**
 * Initialize Sentry Frontend Observability with PHI Redaction Hooks
 */
export function initSentryObservability(): void {
  if (isSentryInitialized) return;

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: import.meta.env.MODE || "development",
      integrations: [],
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      enabled: import.meta.env.PROD,
      beforeSend(event) {
        if (event.extra) {
          event.extra = sanitizePhiData(event.extra) as Record<string, unknown>;
        }
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map((b) => ({
            ...b,
            data: sanitizePhiData(b.data) as Record<string, unknown>
          }));
        }
        return event;
      },
      beforeBreadcrumb(breadcrumb) {
        if (breadcrumb.data) {
          breadcrumb.data = sanitizePhiData(breadcrumb.data) as Record<string, unknown>;
        }
        return breadcrumb;
      }
    });
    isSentryInitialized = true;
    if (import.meta.env.DEV) {
      console.log("[Sentry Observability] Initialized with PHI redaction hooks.");
    }
  } catch (err: unknown) {
    if (import.meta.env.DEV) {
      console.warn("[Sentry Observability] DSN initialization skipped fallback:", err);
    }
  }
}

/**
 * Log structured clinical action breadcrumbs to Sentry
 */
export function addClinicalBreadcrumb(category: string, message: string, data?: DynamicStateObject): void {
  try {
    Sentry.addBreadcrumb({
      category: `clinical.${category}`,
      message,
      data: sanitizePhiData(data) as Record<string, unknown>,
      level: "info"
    });
  } catch {
    // Ignore reporting errors
  }
}

/**
 * Capture client exception to Sentry
 */
export function captureClinicalException(error: Error | unknown, context?: DynamicStateObject): void {
  try {
    if (context) {
      Sentry.setContext("clinical_flow", sanitizePhiData(context) as Record<string, unknown>);
    }
    Sentry.captureException(error);
  } catch {
    // Ignore reporting errors
  }
}

export default {
  initSentryObservability,
  addClinicalBreadcrumb,
  captureClinicalException,
  sanitizePhiData
};
