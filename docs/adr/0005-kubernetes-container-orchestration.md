# 5. Production Kubernetes Multi-Pod Container Orchestration

* **Status**: Accepted
* **Date**: 2026-07-28

## Context

Deploying TeleCare+ in enterprise production environments requires automated horizontal scaling, self-healing, rolling updates, and resource allocation controls.

## Decision

We defined declarative **Kubernetes Production Deployment Manifests** (`k8s/`) featuring:
- 3-replica backend deployment with liveness and readiness actuator health probes (`/actuator/health`).
- LoadBalancer service for React Nginx SPA.
- StatefulSets for PostgreSQL 16 database and Redis cache cluster.

## Consequences

* **Positive**: Automated pod failover, zero-downtime rolling deployments, and explicit CPU/Memory request limits.
* **Negative**: Requires Kubernetes cluster infrastructure and container image registry pipeline.

## Alternatives Considered

* **Single Docker Compose**: Retained for local developer environment setup; superseded by Kubernetes for multi-pod production environments.
