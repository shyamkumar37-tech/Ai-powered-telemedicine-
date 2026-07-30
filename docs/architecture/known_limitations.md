# 📑 TeleCare+ Known Limitations & Future Architecture Roadmap

This document provides an evidence-based overview of current architectural trade-offs, technical limitations, and future roadmap priorities for **TeleCare+**.

---

## 1. Current Architectural Trade-Offs & Limitations

### 1. In-Memory WebSocket STOMP Broker (Multi-Pod Scaling)
- **Current Behavior**: The `communication` module utilizes Spring's in-memory `SimpleBroker` for WebSockets signaling (`/queue/webrtc`, `/topic/vitals`).
- **Limitation**: In multi-pod Kubernetes deployments without session stickiness or an external message broker relay, signaling frames sent to Pod A will not broadcast to clients connected to Pod B.
- **Future Roadmap**: Configure `config.enableStompBrokerRelay(...)` with RabbitMQ or Redis STOMP Relay for multi-pod deployments.

---

### 2. Wearable IoT Telemetry Database Write Throughput
- **Current Behavior**: Bulk wearable vital stream ingestion (`/api/clinical/wearables/ingest`) executes batch database persistence (`healthRecordRepository.saveAll(records)`).
- **Limitation**: Under continuous high-frequency telemetry loads from > 10,000 active smartwatches, direct database persistence can create I/O pressure on the primary PostgreSQL connection pool.
- **Future Roadmap**: Integrate an asynchronous messaging buffer (Apache Kafka or Redis Streams) to queue telemetry streams prior to database batch flushing.

---

### 3. Frontend Bundle Size & Heavy Charting Vendors
- **Current Behavior**: Frontend assets feature manual Rollup chunk splitting (`chart-vendor`, `framework-vendor`, `ui-vendor`) configured with `chunkSizeWarningLimit: 1200`.
- **Limitation**: Heavy analytical pages (`TriagePage`, `AdminDashboardPage`) load large visualization libraries (`recharts`) on initial route visit.
- **Future Roadmap**: Implement deeper dynamic component lazy loading (`React.lazy()`) for heavy analytical sub-panels.

---

## 2. Planned Roadmap Priorities

1. **Phase 1 (Near-Term)**: Redis STOMP Broker Relay configuration for horizontally autoscaled backend pods.
2. **Phase 2 (Medium-Term)**: Kafka event stream topic partitioning for enterprise wearable device streams.
3. **Phase 3 (Long-Term)**: On-device privacy-preserving Federated Learning models for patient deterioration risk scoring.
