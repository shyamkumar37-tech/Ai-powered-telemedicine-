# Telecare+ Operations Runbook

## Environment Variables
- `TELECARE_DB_PASSWORD`: Core Postgres password.
- `TELECARE_JWT_SECRET`: HS512 secret for token signing.
- `SPRING_DATA_REDIS_HOST`: Redis host URI.

## Performance Optimization Report
- **Frontend**: Implemented React.lazy() and Suspense for route-level code splitting. Vite compresses assets automatically.
- **Backend**: Enabled Resilience4j Rate Limiting, Redis Caching, and strict N+1 query elimination.
- **Security**: Hardened Nginx headers (HSTS, CSP, XSS-Protection).

## Troubleshooting & FAQ
- **Q**: Elasticsearch container exits with code 137 (OOM)?
  **A**: Increase Docker Desktop memory limits to at least 8GB.
- **Q**: Keycloak fails to import realm?
  **A**: Ensure `ops/telecareplus-realm.json` has read permissions.
