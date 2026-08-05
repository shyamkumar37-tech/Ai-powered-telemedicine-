# TeleCare+ Offline Data Retention & Caching Policy

## Overview
TeleCare+ implements a strict, HIPAA-aligned offline caching policy to balance offline usability in low-bandwidth clinical settings with data privacy protection on shared or public devices.

---

## 1. Cached Resources Strategy
* **Static Assets (PWA App Shell)**: HTML, JS bundles, CSS, fonts, and static UI icons are precached via Workbox (`CacheFirst` / `StaleWhileRevalidate`).
* **Clinical Data (PHI)**:
  * Restricted strictly to active session data (e.g. today's schedule, active prescription views).
  * Never stored indefinitely in persistent storage across sessions.

---

## 2. Retention Limits & TTL
* **In-Memory Cache (React Query)**: `staleTime: 5 minutes`, `gcTime: 15 minutes`.
* **Service Worker Caches**: Expire after 24 hours maximum for API endpoints.

---

## 3. Mandatory Logout Purge Trigger
Whenever a user logs out (`logout()` call in `AuthContext`):
1. In-memory Auth Tokens and User Profiles are zeroed out.
2. LocalStorage & SessionStorage keys are stripped (`clearAuthStorageArtifacts()`).
3. **`CacheStorage` API is completely purged** (`caches.keys().then(...)`), deleting all Workbox precaches and dynamic API caches to prevent cross-user PHI leakage on shared hardware.

---

## 4. Compliance Audits
* **HIPAA Security Rule § 164.312(a)(2)(iv)**: Automatic logout & local data erasure.
* **GDPR Article 32**: Encryption in transit and local storage wipe upon session termination.
