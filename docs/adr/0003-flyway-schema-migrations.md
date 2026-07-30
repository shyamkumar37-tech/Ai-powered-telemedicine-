# 3. Versioned Flyway SQL Database Schema Migrations

* **Status**: Accepted
* **Date**: 2026-07-28

## Context

Using Hibernate auto-DDL (`spring.jpa.hibernate.ddl-auto=update`) in production risks introducing uncontrolled schema drift, unindexed foreign keys, and un-tracked DDL modifications.

## Decision

We mandated **Flyway SQL Database Migrations** (`V1__` through `V13__`) as the sole source of database schema truth. In production profiles (`application-prod.properties`), Hibernate is restricted to `ddl-auto=validate`.

## Consequences

* **Positive**: Deterministic, reproducible database schemas across development, staging, and production environments.
* **Positive**: Every database index and foreign key constraint is explicitly documented and version-controlled.
* **Negative**: Requires writing explicit SQL scripts for every entity schema alteration.

## Alternatives Considered

* **Hibernate Auto-DDL**: Rejected for production due to high risk of schema drift and unintended table lockouts during application boot.
