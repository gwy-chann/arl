# Feature Specification: SMS Resilience Circuit Breaker Integration, Timeout Protection & Audit Ledger Logging (TextBee)

**Feature Key**: `ARL-42`  
**Feature Slug**: `029-textbee-resilience-circuit-breaker-audit`  
**Jira Story**: STORY-6.3: SMS Resilience Circuit Breaker Integration, Timeout Protection & Audit Ledger Logging  
**Epic**: EPIC-6: Alternative SMS Gateway & Physical Device Resilience (TextBee)  
**Status**: Ready for Planning & Implementation  

---

## Clarifications & Defaults

- **Q: How does the circuit breaker detect and treat physical Android device disconnections vs cloud API errors?**  
  → **A**: When the paired Android phone is offline, battery dead, or unreachable, TextBee returns a device offline indicator (or 503/504 gateway response). The resilience engine classifies this as a transient failure condition (`DEVICE_OFFLINE`). Each occurrence increments the consecutive failure counter. Once 3 consecutive failures occur, the circuit breaker trips from `CLOSED` to `OPEN`.
- **Q: What is the fast-fail behavior when the circuit breaker is in `OPEN` state?**  
  → **A**: Outbound SMS dispatch calls immediately fast-fail in $< 1\text{ms}$ with `CIRCUIT_OPEN` error code and an explanatory message (`"Circuit breaker is OPEN. Outbound SMS suppressed."`), preventing API request workers from blocking or hanging on dead hardware.
- **Q: How does request timeout protection work?**  
  → **A**: Every outbound dispatch is bounded by an `AbortController` enforcing a strict 5,000ms deadline. If the TextBee gateway or device fails to respond within 5,000ms, the request is aborted and categorized as a `TIMEOUT` resilience error.
- **Q: What gateway tag and audit metadata are recorded in the database?**  
  → **A**: Every outbound SMS attempt (whether successful, failed, or skipped) records an immutable entry into `sms_dispatch_logs` with `gateway_name = "TEXTBEE"`, the TextBee message UUID in `gateway_message_id`, and round-trip execution latency in `latency_ms`.
- **Q: How are mock and test environments supported?**  
  → **A**: When `TEXTBEE_MOCK_DISPATCH="true"` or `TEXTBEE_API_KEY` is not configured, the TextBee adapter generates synthetic dispatch responses with deterministic message UUIDs, allowing end-to-end testing without external network dependencies.

---

## 1. User Story

**As an** operations manager and site reliability engineer,  
**I want to** integrate the TextBee provider into the `sms-resilience.ts` circuit breaker engine and `sms-dispatch-audit-service.ts` ledger,  
**so that** mobile device disconnections fail gracefully without blocking request workers, 5,000ms timeouts are strictly enforced, and every outbound text records an immutable audit trail with `gateway_name = "TEXTBEE"`.

---

## 2. Context & Business Rationale

1. **Hardware Unreliability Protection**:
   - Cloud SMS gateways (like PhilSMS) fail primarily due to telco balance depletion or cloud provider maintenance. In contrast, an Android phone gateway running TextBee is vulnerable to battery depletion, Wi-Fi drops, sleep mode, and cellular carrier loss.
   - Without circuit breaker protection, worker processes would stall waiting for unresponsive hardware, cascading into connection pool exhaustion and sluggish user experience across POS and customer management.

2. **Strict Request Deadlines**:
   - The 5,000ms timeout prevents hanging requests when the Android device is in a low-power half-connected state.
   - Exponential backoff with random jitter prevents thundering herd retries when the device reconnects.

3. **Complete Audit Traceability**:
   - Store owners and administrators require full auditability for every debt collection notice or customer reminder sent.
   - Recording `gateway_name = "TEXTBEE"`, recipient mobile, dispatch status, latency, and gateway message identifier guarantees verifiable compliance and dispute resolution.

---

## 3. Business Invariants & Domain Rules

1. **Circuit Breaker State Machine Invariants**:
   - `CLOSED`: Normal operation. Outbound requests are allowed. Consecutive failures $< 3$.
   - `OPEN`: Tripped after 3 consecutive transient failures (or device disconnects). All outbound dispatches immediately rejected without network calls ($< 1\text{ms}$).
   - `HALF_OPEN`: Entered after 60,000ms cooldown. Exactly 1 trial probe request is allowed.
     - If the trial probe succeeds $\to$ transitions back to `CLOSED` and resets failure counter to 0.
     - If the trial probe fails $\to$ immediately trips back to `OPEN` for another 60,000ms cooldown.

2. **Error Classification Rules**:
   - **Transient / Retryable Errors** (Trip circuit breaker on threshold):
     - `DEVICE_OFFLINE`: TextBee device is unreachable or disconnected.
     - `TIMEOUT`: Request exceeded 5,000ms deadline.
     - `NETWORK_UNREACHABLE`: Fetch / socket failure.
     - `GATEWAY_RATE_LIMITED` (HTTP 429).
     - `GATEWAY_SERVER_ERROR` (HTTP 500, 502, 503, 504).
   - **Non-Transient / Permanent Errors** (Do NOT trip circuit breaker; no retry):
     - `GATEWAY_AUTH_ERROR` (HTTP 401).
     - `GATEWAY_BAD_REQUEST` (HTTP 400).
     - `DEVICE_NOT_FOUND` (HTTP 404).
     - `INVALID_RECIPIENT_MOBILE` / `INVALID_INPUT` (Malformed phone number or empty message).

3. **Audit Ledger Schema Invariants**:
   - Table: `public.sms_dispatch_logs`
   - `gateway_name`: `'TEXTBEE'` (stored uppercase).
   - `gateway_message_id`: TextBee-assigned UUID or mock UUID.
   - `status`: `'SENT'` on success, `'FAILED'` on delivery/network error, `'SKIPPED'` on invalid number.
   - `latency_ms`: Non-negative integer representing execution duration in milliseconds.
   - Audit records are strictly append-only (immutable triggers prevent update or delete).

---

## 4. Acceptance Criteria (BDD Gherkin Scenarios)

```gherkin
Feature: TextBee SMS Resilience Circuit Breaker & Audit Ledger Logging (ARL-42)

  Scenario: Audit Log Generation on Successful Dispatch via TextBee
    Given an outbound SMS dispatch request for customer overdue balance reminder
    And the TextBee gateway is configured as the active SMS provider
    And the paired Android device is online with healthy battery and connectivity
    When the system dispatches the message via TextBee
    Then the dispatch completes successfully with a valid message identifier
    And an audit entry is written to sms_dispatch_logs with gateway_name = "TEXTBEE"
    And the audit entry status is "SENT"
    And the audit entry contains a non-negative execution latency in latency_ms
    And the circuit breaker remains in CLOSED state

  Scenario: Device Disconnect Circuit Protection & Fast-Fail
    Given the paired Android phone running TextBee is offline or unpowered
    When consecutive dispatch failures reach the failure threshold (3)
    Then the circuit breaker transitions from CLOSED to OPEN
    And all subsequent dispatch calls immediately reject in < 1ms with CIRCUIT_OPEN error
    And request workers do not block or hang waiting for network responses
    And each failed attempt is logged to the audit ledger with status "FAILED" and gateway_name "TEXTBEE"

  Scenario: Strict 5000ms Timeout Enforcement via AbortController
    Given the TextBee gateway API or device stalls indefinitely without responding
    When an outbound SMS dispatch is executed
    Then the request is aborted exactly at 5000ms by AbortController
    And the operation returns errorCode "TIMEOUT"
    And the timeout failure is counted toward circuit breaker consecutive failures

  Scenario: Circuit Breaker Half-Open Probing and Recovery
    Given the circuit breaker is in OPEN state
    And the 60,000ms cooldown window has elapsed
    When the next SMS dispatch is attempted
    Then the circuit breaker enters HALF_OPEN state and permits exactly 1 probe request
    And if the TextBee dispatch succeeds, the circuit breaker resets to CLOSED with 0 failures
    And if the TextBee dispatch fails, the circuit breaker immediately trips back to OPEN

  Scenario: Non-Retryable Error Fast-Fail without Tripping Breaker
    Given an SMS dispatch with invalid credentials (HTTP 401) or invalid phone format
    When dispatch is attempted
    Then the request fails immediately without retry
    And the circuit breaker does not increment its consecutive failure counter
    And an audit log is created with status "FAILED" or "SKIPPED"
```

---

## 5. Success Criteria

1. **Worker Safety**: Outbound calls to an offline phone fail in $< 1\text{ms}$ when circuit is open, preventing thread starvation.
2. **Deterministic Deadline**: $100\%$ of stalling HTTP requests are aborted at $5,000\text{ms}$.
3. **Audit Integrity**: $100\%$ of outbound SMS attempts through TextBee record an immutable audit row with `gateway_name = "TEXTBEE"`.
4. **Test Coverage**: $100\%$ test pass rate across unit, integration, and resilience test suites.
