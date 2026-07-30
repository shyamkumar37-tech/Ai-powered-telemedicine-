# 1. Spring Modulith Modular Monolith Architecture

* **Status**: Accepted
* **Date**: 2026-07-28

## Context

TeleCare+ serves 5 primary user roles (Patient, Doctor, Caregiver, Pharmacist, Admin) across multiple domain capabilities (Vitals, Appointments, e-Prescriptions, Billing, AI Scribing). Building a traditional distributed microservice architecture during early deployment creates high network latency, complex operational overhead, and distributed transaction management overhead. Conversely, a unstructured monolithic application risks accumulating uncontrolled cyclic dependencies over time.

## Decision

We selected **Spring Modulith** to build a **Modular Monolith**. Application logic is organized into zero-cycle domain packages (`common`, `users`, `clinical`, `pharmacy`, `communication`, `notification`, `ai`, `appointments`, `billing`, `admin`). Cross-domain communication is restricted to public service contracts and asynchronous domain events published via Spring's `ApplicationEventPublisher`.

## Consequences

* **Positive**: Zero cross-domain cyclic package dependencies verified automatically in CI via `TelecareApplicationModulesTest`.
* **Positive**: Simplified single-artifact deployment and local debugging with high in-memory method execution speed.
* **Positive**: Clear domain boundaries enable future microservice extraction without rewriting business logic.
* **Negative**: Requires strict developer discipline to prevent improper package imports.

## Alternatives Considered

* **Microservices Architecture**: Rejected due to high operational deployment overhead, network latency, and distributed transaction complexity for single-region deployments.
* **Unstructured Monolith**: Rejected due to the high risk of accumulating spaghetti code and circular package dependencies over time.
