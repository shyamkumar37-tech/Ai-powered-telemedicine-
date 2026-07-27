# Telecare+ Deployment Guide

## Installation Guide (Local Development)
1. Clone the repository.
2. Run `cp .env.example .env` and populate secrets.
3. Frontend: `cd frontend && npm install && npm run dev`
4. Backend: `cd backend && ./mvnw spring-boot:run`

## Docker Deployment Guide (Production)
1. Ensure Docker Engine and Docker Compose are installed.
2. Run `docker-compose up --build -d`
3. The platform will automatically spin up 6 isolated containers running within the `telecare-net` bridge network.
4. Services map to: Frontend (:5173), Backend API (:8080).
5. All data is persisted via Docker Volumes (`telecareplus-postgres-data`).

## CI/CD Pipeline
- Handled automatically via `.github/workflows/playwright.yml`.
