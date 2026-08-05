# Architecture Decision Record (ADR 001)

## Title: Real-time Transport Selection & Protocol Abstraction for TeleCare+

### Status
**APPROVED / IMPLEMENTED**

### Context
- **Backend Stack Confirmation**: Confirmed Spring Boot 3 / Java 21 repository environment via `backend/pom.xml` (`telecareplus-backend`), `WebSocketConfig.java` (`@EnableWebSocketMessageBroker`), and STOMP message endpoints.

TeleCare+ requires low-latency bidirectional real-time communications for:
1. Patient emergency alerts & vital warning broadcasts.
2. Clinical consultation chat & instant doctor-patient messaging.
3. Caregiver live monitoring updates & field routing status.
4. Pharmacist dispensing queue notifications.

### Decision
We use a **Hybrid Real-Time Transport Strategy**:

1. **Spring Boot Backend Integration**:
   - Transport: **STOMP over SockJS** (`@stomp/stompjs`).
   - Endpoint: `/ws-telecare`
   - Purpose: Enables topic-based publish/subscribe channels (`/topic/alerts`, `/topic/consultations/{id}`, `/user/queue/notifications`) directly integrated into Spring Boot `@MessageMapping` and WebSocket message brokers.

2. **Native WebSockets / SSE Fallback**:
   - Transport: **Native WebSockets (`WebSocket`) & Server-Sent Events (`EventSource`)**.
   - Purpose: If connected to a non-Java microservice (e.g. FastAPI / Node.js AI streaming proxy), the client auto-falls back to native WebSocket or SSE stream listeners.

3. **Vendor SDK Abstraction for Video**:
   - Transport: **Vendor SDK Abstraction** (`IVideoVendorAdapter` supporting Daily.co / Twilio Video / Agora).
   - Purpose: Eliminates hand-rolled RTCPeerConnection signaling code in favor of production TURN infrastructure and reconnection resilience.

### Consequences
- **Pros**:
  - Full compatibility with Spring Boot backend messaging.
  - Zero lock-in: Non-Java backend microservices can stream via native WebSockets / SSE seamlessly.
  - Video calling uses enterprise vendor SDK interfaces without reinventing ICE/TURN signaling.
- **Cons**:
  - Requires maintaining SockJS client fallback when Spring STOMP is enabled.
