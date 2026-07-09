# TeleCare+ Docker Environment

We have configured a complete Docker Compose environment to spin up the entire TeleCare+ stack locally with a single command. 

## What's Included

- **PostgreSQL 16**: The primary relational database.
- **Redis 7**: For caching and session management.
- **Elasticsearch 8.11**: For patient search and indexing.
- **Keycloak 23**: For IAM (Identity and Access Management).
- **Backend (Spring Boot)**: The Java API.
- **Frontend (Vite/React)**: The web portal.

## Getting Started

1. Ensure you have Docker and Docker Compose installed.
2. Copy the `.env.example` file to `.env` (if applicable) or ensure variables like `TELECARE_DB_PASSWORD`, `TELECARE_JWT_SECRET`, and `TELECARE_PUSH_PRIVATE_KEY` are set in a `.env` file at the root.
3. Run the following command from the project root:

```bash
docker-compose up --build
```

This will build the backend and frontend containers from source and start all dependencies. 

## Graceful Degradation & Elasticsearch

The `backend` container is configured to wait for PostgreSQL to be *healthy* before starting, but it only waits for Elasticsearch to be *started*. This respects the graceful degradation pattern: if Elasticsearch is slow to boot or fails, Spring Boot will still start up, and the TeleCare+ search features will automatically disable themselves without crashing the core medical record components.

## Local Dev (Without Docker)

This compose setup does not break traditional local development. You can still run:
- Backend: `./mvnw spring-boot:run`
- Frontend: `npm run dev`

They will connect to `localhost:5432` and `localhost:9200` automatically if you spin up the infrastructure containers (Postgres, Elasticsearch) manually.
