# Feature Specification: Live Gateway Dispatch Engine, Network Timeout Resilience & Circuit-Breaker Fallback

**Feature Key**: `ARL-25`  
**Feature Slug**: `022-sms-resilience-circuit-breaker`  
**Jira Story**: STORY-5.2: Live Gateway Dispatch Engine, Network Timeout Resilience & Circuit-Breaker Fallback  
**Epic**: EPIC-5: Production SMS Gateway Infrastructure & Telecom Delivery (PhilSMS) (`ARL-23`)  
**Status**: Ready for Planning & Implementation  

---

## 1. User Story

**As a** store cashier or administrator,  
**I want** the SMS dispatching subsystem to handle external carrier network timeouts, telco downtime, and PhilSMS HTTP gateway failures through non-blocking error isolation, an active Circuit Breaker pattern, and a 5-second `AbortController` timeout,  
**so that** essential point-of-sale checkout operations, inventory deductions, and payment settlements commit instantly without latency penalties or rollbacks when cellular telecom gateways experience degraded performance.

---

## 2. Context & Business Rationale

1. **Point-of-Sale (POS) Zero-Stall Guarantee**:
   - In physical wholesale condiment distribution (handling busy loading docks and walk-in trade for Toyo, Suka, and Patis), cashier transaction speed is paramount.
   - If an outbound SMS carrier request experiences a network stall (e.g., Globe/Smart cellular packet latency or PhilSMS upstream downtime), the cashier must **never** be frozen behind a loading spinner for 30 seconds.
   - Database operations (inserting sales records, updating inventory stock levels, and generating printable thermal receipts) **MUST** execute and commit unconditionally regardless of SMS gateway connectivity.

2. **Cascading Failure & Resource Exhaustion Prevention**:
   - Without circuit breaking and timeout limits, an external service outage can exhaust serverless execution threads, Node connection pools, or worker memory, creating a site-wide Denial of Service (DoS) for all active store personnel.
   - An active circuit breaker cuts off failing downstream calls immediately (< 1ms), shedding load and preserving server availability.

3. **Telemetry & Resilience Transparency**:
   - Every dispatch execution must capture structured latency and circuit diagnostics (`durationMs`, `circuitState`, `errorCode`) without leaking raw exceptions to UI presentation layers.

---

## 3. Business Invariants & Domain Rules

1. **Circuit Breaker State Machine**:
   - **`CLOSED`**:
     - Normal operational state.
     - Outbound requests flow directly to the PhilSMS API.
     - Consecutive network failures, HTTP 5xx responses, or gateway timeouts increment the failure counter.
     - Any single successful dispatch resets the failure counter to `0`.
     - When consecutive failures reach **3** (`failureThreshold: 3`), the circuit immediately trips to **`OPEN`**.
   - **`OPEN`**:
     - Tripped state.
     - Outbound HTTP requests are blocked immediately (fast-fail in < 1ms).
     - Dispatches return `{ success: false, errorCode: 'CIRCUIT_OPEN', circuitState: 'OPEN' }`.
     - Remains `OPEN` for a **60-second cooldown window** (`cooldownMs: 60000`).
   - **`HALF_OPEN`**:
     - Entered automatically when a dispatch is attempted after the 60-second cooldown has elapsed.
     - Allows exactly **1 trial probe request** to test upstream gateway health.
     - If the trial probe succeeds: the circuit resets to **`CLOSED`**, the failure counter is cleared to `0`, and normal traffic resumes.
     - If the trial probe fails: the circuit immediately re-enters **`OPEN`** for another full 60-second cooldown period.

2. **Strict HTTP Timeout & Non-Blocking Execution**:
   - Outbound HTTP dispatches are wrapped with `AbortController` enforcing a strict **5,000ms (5.0s)** cutoff.
   - If the remote gateway or DNS resolution exceeds 5,000ms, the request is cleanly aborted.
   - The caller receives `{ success: false, errorCode: 'TIMEOUT', circuitState: ... }` without an unhandled promise rejection.

3. **Intelligent Retry Policy with Exponential Backoff & Jitter**:
   - **Eligible Retryable Errors**:
     - Network timeouts (`AbortError`, `TIMEOUT`).
     - Connection resets (`ECONNRESET`, `ENOTFOUND`, `NETWORK_UNREACHABLE`).
     - Upstream gateway errors (`HTTP 502 Bad Gateway`, `HTTP 503 Service Unavailable`, `HTTP 504 Gateway Timeout`).
   - **Non-Retryable Errors** (Immediate Fast-Fail):
     - Client validation errors (`HTTP 400 Bad Request`, `INVALID_INPUT`, `INVALID_RECIPIENT_MOBILE`).
     - Authentication errors (`HTTP 401 Unauthorized`, `GATEWAY_AUTH_ERROR`).
     - Credit exhaustion (`HTTP 402 Payment Required`, `INSUFFICIENT_CREDITS`).
     - Unprocessable recipient (`HTTP 422 Unprocessable Entity`).
   - **Retry Schedule**:
     - Maximum **1 retry attempt** (`maxRetries: 1`).
     - Delay: `1,000ms + random_jitter(0-250ms)`.

4. **Zero-Crash Wrapper (`dispatchSmsSafe`)**:
   - Signature: `dispatchSmsSafe(payload: SmsDispatchPayload, options?: CircuitBreakerOptions): Promise<SafeSmsDispatchResult>`.
   - Never throws exceptions; always resolves with a standardized `SafeSmsDispatchResult` envelope.
   - Standard error codes:
     - `'TIMEOUT'`: Request exceeded 5-second deadline.
     - `'CIRCUIT_OPEN'`: Short-circuited fast-fail because gateway is known to be failing.
     - `'GATEWAY_ERROR'`: Upstream 5xx or unhandled gateway response.
     - `'INVALID_INPUT'`: Invalid phone number or empty message payload.

5. **POS & Cashier Flow Decoupling**:
   - Point-of-sale checkout (sale creation, stock decrement, customer balance update) must complete even if SMS notifications fail or time out.
   - Cashier notification toasts reflect successful transaction creation and show informative non-blocking notice if SMS dispatch was degraded.

---

## 4. BDD Gherkin Acceptance Scenarios

```gherkin
Feature: SMS Gateway Resilience and Circuit Breaker (ARL-25)

  Scenario: Fast-fail timeout when PhilSMS API hangs
    Given the PhilSMS external endpoint is experiencing severe network latency exceeding 5 seconds
    When an SMS dispatch is initiated from the system
    Then the request is aborted at exactly 5,000ms via AbortController
    And the dispatch function returns errorCode "TIMEOUT" without throwing an unhandled exception
    And the calling process finishes without crashing

  Scenario: Point-of-sale checkout commits successfully despite SMS failure
    Given a cashier completing a credit sale with an initial downpayment
    When the sale record and stock deduction commit to the database
    And the accompanying SMS notification fails due to an external gateway error
    Then the sale transaction remains fully committed in Supabase
    And the cashier UI receives a success response with a non-blocking toast warning
    And the customer receipt renders immediately

  Scenario: Circuit breaker trips to OPEN after consecutive gateway failures
    Given the circuit breaker is in CLOSED state
    When 3 consecutive SMS dispatch calls fail due to HTTP 503 Service Unavailable
    Then the circuit breaker transitions to the OPEN state
    And subsequent dispatch requests within the next 60 seconds immediately fast-fail without issuing HTTP requests
    And each fast-failed call returns errorCode "CIRCUIT_OPEN" within 2ms

  Scenario: Circuit breaker recovers through HALF_OPEN state
    Given the circuit breaker has been in the OPEN state for 60 seconds
    When the cooldown timer expires
    Then the circuit breaker shifts to HALF_OPEN state
    And allows a single probe SMS dispatch through to the PhilSMS API
    And when the probe succeeds, the circuit breaker resets to CLOSED and failure counters clear

  Scenario: Transient 502 error recovers on single retry
    Given the PhilSMS API returns HTTP 502 on the initial attempt
    When the resilience engine catches the transient 502
    Then it pauses for ~1,000ms with jitter
    And re-attempts the HTTP request
    And if the second attempt succeeds, the caller receives a success response with duration logged

  Scenario: Non-retryable errors fail immediately without retry
    Given a recipient mobile number rejected with HTTP 401 Unauthorized or HTTP 402 Insufficient Balance
    When dispatchSmsSafe is invoked
    Then it fails immediately on the first attempt without executing any retry
    And does not trip the circuit breaker for client/auth configuration mistakes
```

---

## 5. Failure Modes & Circuit Breaker Recovery Matrix

| Condition | Failure Count Trigger | Circuit State | Immediate Action | Caller Return Object |
| :--- | :--- | :--- | :--- | :--- |
| **Normal 200 OK** | Resets fail counter to 0 | `CLOSED` | Returns message ID immediately | `{ success: true, messageId: "...", circuitState: 'CLOSED' }` |
| **HTTP 502 / 503 / 504** | Increments fail counter | `CLOSED` $\rightarrow$ `OPEN` (at 3) | 1 retry with backoff (1s + jitter); logs error | `{ success: false, errorCode: 'GATEWAY_ERROR', circuitState: ... }` |
| **Timeout (> 5s)** | Increments fail counter | `CLOSED` $\rightarrow$ `OPEN` (at 3) | Aborts request at 5000ms; logs warning | `{ success: false, errorCode: 'TIMEOUT', circuitState: ... }` |
| **Circuit Tripped** | N/A (within 60s window) | `OPEN` | Rejects instantly (< 1ms); suppresses HTTP | `{ success: false, errorCode: 'CIRCUIT_OPEN', circuitState: 'OPEN' }` |
| **Cooldown Expired** | 1 probe allowed | `HALF_OPEN` | Passes 1 test probe to PhilSMS | Normal dispatch outcome |
| **Non-Retryable (400/401/402/422)** | No circuit trip | Unchanged | Fast fail without retry | `{ success: false, errorCode: 'INVALID_INPUT' \| 'GATEWAY_ERROR' }` |
