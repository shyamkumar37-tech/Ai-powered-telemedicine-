# 2. Stateless JWT & Cookie Authentication Strategy

* **Status**: Accepted
* **Date**: 2026-07-28

## Context

TeleCare+ requires stateless, role-based access control (RBAC) across Patients, Doctors, Caregivers, Pharmacists, and Administrators accessing REST and GraphQL endpoints. Storing refresh tokens in browser `localStorage` exposes them to Cross-Site Scripting (XSS) attacks.

## Decision

We adopted **Stateless JWT Bearer Tokens** for short-lived authorization headers paired with **`HttpOnly` CSRF Protection Cookies (`XSRF-TOKEN`)** and Spring Security OAuth2 Resource Server integration.

## Consequences

* **Positive**: High API throughput without requiring database session lookups on every HTTP request.
* **Positive**: `HttpOnly` cookies mitigate token theft via malicious XSS scripts.
* **Negative**: Requires strict token expiration and secret key management.

## Alternatives Considered

* **Server-Side HTTP Sessions**: Rejected due to stateful memory bottlenecks and session replication overhead across load-balanced application servers.
