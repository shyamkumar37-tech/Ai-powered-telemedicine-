# 🧪 TeleCare+ JaCoCo Code Coverage Execution Guide

This document outlines how to generate, inspect, and publish backend unit and integration test code coverage reports for **TeleCare+**.

---

## 1. Generating Backend JaCoCo Coverage Reports

The backend project uses the **JaCoCo Maven Plugin** to track code coverage across unit, repository, service, and controller tests.

### Step 1: Run Maven Test Suite with JaCoCo
```bash
cd backend
./mvnw clean test jacoco:report
```

### Step 2: View HTML Coverage Report
Once execution finishes, open the generated HTML report in your browser:
```text
backend/target/site/jacoco/index.html
```

---

## 2. Coverage Thresholds & Configuration

JaCoCo is configured in `backend/pom.xml` to measure coverage across domain service classes:
- **Element Covered**: Line, Branch, Instruction, and Method Coverage.
- **Excluded Classes**: Generated DTO records, Lombok getters/setters, and Flyway database migration scripts.

---

## 3. Frontend Code Coverage

To run frontend Vitest coverage:
```bash
cd frontend
npm run test:coverage
```
Coverage results will be generated in `frontend/coverage/index.html`.
