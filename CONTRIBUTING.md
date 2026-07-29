# Contributing to TeleCare+

Thank you for your interest in contributing to **TeleCare+**! We welcome pull requests, bug reports, feature suggestions, and documentation improvements.

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## How to Contribute

### 1. Prerequisites
- **Java 21 JDK** (Temurin / Corretto)
- **Node.js 20+** & npm
- **Docker Desktop** / Docker Compose

### 2. Local Setup
```bash
# Clone the repository
git clone https://github.com/shyamkumar37-tech/Ai-powered-telemedicine-.git
cd Ai-powered-telemedicine-

# Build and verify backend
cd backend
./mvnw clean compile -DskipTests
./mvnw test -Dtest=TelecareApplicationModulesTest

# Install frontend dependencies
cd ../frontend
npm ci --legacy-peer-deps
npm run build
```

---

## Architectural Rules

1. **Spring Modulith Compliance**:
   - Zero cross-domain cyclic package dependencies allowed.
   - All inter-module communication must use `ApplicationEventPublisher` domain events or clean public service APIs.
   - Every architectural change must pass `TelecareApplicationModulesTest`.

2. **Code Quality**:
   - Follow SOLID and Clean Architecture principles.
   - Write unit and integration tests for new features.
   - Format Java code according to standard Google Java Style.

---

## Pull Request Process

1. Fork the repository and create a feature branch (`feature/my-awesome-feature`).
2. Commit your changes with semantic commit messages (`feat: add DICOM visualizer`, `fix(ci): resolve build timeout`).
3. Ensure all backend tests (`./mvnw test`) pass cleanly.
4. Submit a Pull Request targeting `main`.
