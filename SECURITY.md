# Security Policy & HIPAA Compliance

## Security Overview

**TeleCare+** is engineered with a Security-First architecture complying with **HIPAA**, **GDPR**, and **OWASP Top 10** standards:

- **Stateless OAuth2 / JWT Authentication**: Short-lived access tokens paired with secure httpOnly refresh cookies.
- **Role-Based Access Control (RBAC)**: Enforced via Spring Security `@PreAuthorize` annotations across all domain REST controllers.
- **HIPAA Access Audit Logging**: Automatic interception of PHI (Protected Health Information) access logged to `access_audit_log` via `@AuditLog`.
- **CSRF & XSS Protection**: Cookie-based CSRF protection (`XSRF-TOKEN`) with strict Content Security Policy (`CSP`) headers.
- **Data Isolation**: Schema-based multi-tenancy enforced using Hibernate 6 `@TenantId`.

---

## Reporting a Vulnerability

We take the security of healthcare data with utmost seriousness. If you discover a security vulnerability within TeleCare+, please report it responsibly:

1. **Email**: Send vulnerability disclosures to `security@telecareplus.health`.
2. **Details**: Include steps to reproduce, impact assessment, and proof of concept.
3. **Response Time**: Our security team will acknowledge receipt within **24 hours** and provide a patch timeline within **72 hours**.

Please do NOT create public GitHub issues for security vulnerabilities.
