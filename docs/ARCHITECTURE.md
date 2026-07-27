# Telecare+ System Architecture

## High-Level System Design
The platform utilizes a modern containerized microservices approach.
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion
- **Backend**: Spring Boot 3, Spring Security, Spring AI, WebSockets (STOMP)
- **Database**: PostgreSQL (Relational Data), Redis (Caching)
- **Search**: Elasticsearch (Audit & Analytics)
- **Identity**: Keycloak (OAuth2 / OIDC)

## Entity Relationship (ER) Diagram
```mermaid
erDiagram
    USERS ||--o{ PATIENTS : "is a"
    USERS ||--o{ DOCTORS : "is a"
    PATIENTS ||--o{ APPOINTMENTS : books
    DOCTORS ||--o{ APPOINTMENTS : conducts
    DOCTORS ||--o{ PRESCRIPTIONS : writes
    PATIENTS ||--o{ PRESCRIPTIONS : receives
```

## Security Flow
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Keycloak
    participant Backend
    User->>Frontend: Login
    Frontend->>Keycloak: Authenticate
    Keycloak-->>Frontend: JWT Access Token
    Frontend->>Backend: Request API (Bearer Token)
    Backend-->>Frontend: Authorized Response
```
