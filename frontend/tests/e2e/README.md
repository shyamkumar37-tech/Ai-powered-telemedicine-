# TeleCare+ E2E Test Suite

This suite uses [Playwright](https://playwright.dev/) to test the primary user flows for TeleCare+.

## Running Tests Locally

1. **Start the Backend**: Make sure the Spring Boot backend is running locally on port `8080`.
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

2. **Start the Frontend**: Make sure the Vite frontend is running on port `5173`.
   ```bash
   cd frontend
   npm run dev
   ```

3. **Run the Tests**:
   ```bash
   cd frontend
   npm run test:e2e
   ```
   To run in UI mode for debugging:
   ```bash
   npx playwright test --ui
   ```

## Missing Elasticsearch?

If Elasticsearch is down, the search tests will fail. You can skip tests that strictly require Elasticsearch by running:
```bash
$env:ELASTICSEARCH_DOWN="true"
npm run test:e2e
```
(On Mac/Linux use `ELASTICSEARCH_DOWN=true npm run test:e2e`)

Tests that search for patients check this environment variable and call `test.skip()` dynamically.

## Mocking Boundaries

- **WebRTC**: Real webcams are bypassed using Playwright network intercepts.
- **Maps**: Leaflet tile requests (`*.png`) are intercepted to speed up tests and avoid rate-limiting.
