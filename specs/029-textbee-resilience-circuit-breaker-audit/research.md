# Technical Research & Architecture Decisions: TextBee Resilience Circuit Breaker & Audit Ledger

**Feature Key**: `ARL-42`  
**Feature Slug**: `029-textbee-resilience-circuit-breaker-audit`  

---

## 1. Architectural Strategy & Design Patterns

### 1.1 TextBee Outbound SMS Adapter (`lib/services/textbee-adapter.ts`)
- **API Protocol**:
  - `POST ${TEXTBEE_API_URL}/gateway/devices/${TEXTBEE_DEVICE_ID}/sendSMS`
  - Authentication: `x-api-key: ${TEXTBEE_API_KEY}`
  - Content-Type: `application/json`
  - Body:
    ```json
    {
      "recipients": ["+639171234567"],
      "message": "ARLQ Notice: Overdue balance..."
    }
    ```
  - Response contract:
    ```json
    {
      "success": true,
      "data": {
        "id": "uuid-v4-or-textbee-id",
        "status": "SENT"
      }
    }
    ```
- **Device Disconnection Error Signals**:
  - TextBee returns specific JSON error signatures when the Android phone is disconnected:
    - HTTP 503/400 with `{ "error": "Device is offline", "code": "DEVICE_OFFLINE" }`
    - Or `{ "success": false, "message": "Device not reachable" }`
  - The adapter standardizes these into `TextBeeErrorCode`:
    - `'DEVICE_OFFLINE'` (Phone turned off, Wi-Fi lost, battery drained)
    - `'DEVICE_NOT_FOUND'` (Device ID invalid in console)
    - `'GATEWAY_AUTH_ERROR'` (API key revoked or missing)
    - `'GATEWAY_BAD_REQUEST'` (Payload validation failed)
    - `'GATEWAY_RATE_LIMITED'` (Rate limit exceeded)
    - `'GATEWAY_SERVER_ERROR'` (TextBee cloud outage)
    - `'TIMEOUT'` (Exceeded 5,000ms deadline)
    - `'NETWORK_UNREACHABLE'` (Local network failure)

### 1.2 Circuit Breaker Extension (`lib/services/sms-resilience.ts`)
- **Polymorphic Gateway Support**:
  - Extend `dispatchSmsSafe` options to accept an optional `gateway?: 'PHILSMS' | 'TEXTBEE'` property (defaulting to PhilSMS or configured active gateway).
  - Update `isRetryableError` to recognize TextBee error codes:
    - `DEVICE_OFFLINE` $\to$ `true` (transient; consecutive occurrences trip breaker to protect server workers).
    - `GATEWAY_RATE_LIMITED`, `GATEWAY_SERVER_ERROR`, `NETWORK_UNREACHABLE`, `TIMEOUT` $\to$ `true`.
    - `DEVICE_NOT_FOUND`, `GATEWAY_AUTH_ERROR`, `GATEWAY_BAD_REQUEST`, `INVALID_RECIPIENT_MOBILE` $\to$ `false`.
- **Fast-Fail Execution**:
  - When the circuit breaker is in `OPEN` state, `canExecute()` returns `false`.
  - The dispatcher returns `{ success: false, errorCode: 'CIRCUIT_OPEN', ... }` in $< 1\text{ms}$ without spawning any HTTP fetch or waiting on timers.

### 1.3 Immutable Audit Ledger Integration (`lib/services/sms-audit-service.ts`)
- **Database Schema**:
  - Supabase table `public.sms_dispatch_logs` already defines:
    - `gateway_name VARCHAR(20) NOT NULL DEFAULT 'PHILSMS'`
    - `gateway_message_id VARCHAR(100) NULL`
    - `latency_ms INTEGER NULL`
  - `'TEXTBEE'` is a 7-character string, fitting comfortably within `VARCHAR(20)`.
  - No database migration is required since `gateway_name` accepts any string up to 20 characters and `sms-audit-contracts.ts` already normalizes `gatewayName`.
- **Dual Naming Compatibility**:
  - Jira specifies recording latency in `execution_latency_ms` and schema has `latency_ms`.
  - The DTO and input contracts accommodate both `executionLatencyMs` / `execution_latency_ms` and `latencyMs` / `latency_ms` for seamless compatibility.

### 1.4 Mock & Testing Isolation
- Provide `_resetTextBeeSendMock()` and test overrides in `textbee-adapter.ts` to simulate:
  - Immediate dispatch success with UUID.
  - Device offline error (for tripping the circuit breaker in exactly 3 calls).
  - Indefinite hang (for verifying the 5,000ms AbortController timeout).
  - HTTP 401 Unauthorized (for verifying non-retryable behavior).

---

## 2. Technology Stack & Dependencies

- **Runtime**: Next.js App Router (Node.js runtime)
- **Validation**: Zod 3.x for schema validation
- **HTTP Abort**: Standard Web API `AbortController` and `AbortSignal`
- **Testing**: Node.js Test Runner (`node:test`, `node:assert/strict`)
- **Database**: Supabase PostgreSQL (`public.sms_dispatch_logs`)
