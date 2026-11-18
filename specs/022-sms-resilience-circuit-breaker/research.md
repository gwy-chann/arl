# Research & Architecture Decisions: SMS Gateway Resilience & Circuit Breaker

**Feature Key**: `ARL-25`  
**Feature Slug**: `022-sms-resilience-circuit-breaker`  
**Author**: Antigravity Assistant  

---

## 1. Context & Architectural Constraints

The ARLQ POS and wholesale inventory management system operates in retail storefronts and warehouse loading docks. Point-of-sale transactions (such as wholesale sales of Toyo, Suka, and Patis in 350ml, 1L, and 1gal sizes) create stock deductions, calculate balances, and issue receipts. Under ARL-15 and ARL-24, sales and overdue reminders trigger outbound SMS dispatches to customer and admin mobile numbers.

When cellular telecom gateways experience degraded latency, packet loss, or maintenance outages, unmitigated synchronous HTTP calls can cause:
1. Blocked POS checkout flows that leave cashiers and customers waiting for up to 30–60 seconds.
2. Connection exhaustion in serverless runtimes.
3. Cascading failures where SMS outages impact core inventory transactions.

---

## 2. Decision Matrix & Patterns

### 2.1 Circuit Breaker Implementation Pattern
- **Decision**: Implement an in-memory `CircuitBreaker` class with configurable parameters (`failureThreshold: 3`, `cooldownMs: 60000`, `timeoutMs: 5000`, `maxRetries: 1`).
- **Rationale**:
  - The in-memory state machine maintains fast-fail overhead of < 0.1ms during the `OPEN` state.
  - Configurable options and an injectable clock `nowFn: () => number` allow deterministic unit tests using simulated clock advancement without relying on fragile multi-second real-time delays.
  - Provides a shared default singleton instance `smsCircuitBreaker` while exporting the class for isolated testing.

### 2.2 Timeout Mechanism (`AbortController` & `AbortSignal`)
- **Decision**: Wrap HTTP requests with an `AbortController` timer pattern:
  ```typescript
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, ... });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError' || controller.signal.aborted) {
      throw new SmsTimeoutError(`SMS dispatch timed out after ${timeoutMs}ms`);
    }
    throw err;
  }
  ```
- **Rationale**: Works reliably across all Node.js 18+ and Next.js App Router server environments without compatibility discrepancies.

### 2.3 Transient vs. Non-Transient Error Discrimination
- **Transient (Retryable & Circuit-Tripping)**:
  - Network timeouts (`AbortError`, `ETIMEDOUT`).
  - Network socket errors (`ECONNRESET`, `ENOTFOUND`, `EAI_AGAIN`).
  - HTTP `502 Bad Gateway`, `503 Service Unavailable`, `504 Gateway Timeout`.
  - PhilSMS adapter error code `NETWORK_UNREACHABLE`.
- **Non-Transient (Non-Retryable, Does Not Trip Circuit)**:
  - HTTP `400 Bad Request` (bad input syntax).
  - HTTP `401 Unauthorized` (invalid API token).
  - HTTP `402 Payment Required` (depleted SMS credits).
  - HTTP `422 Unprocessable Entity` (invalid recipient number format).
  - Validation failures (`INVALID_INPUT`, `INVALID_RECIPIENT_MOBILE`).
- **Rationale**: Retrying an invalid mobile number or bad auth token burns CPU cycles and delays the response with zero probability of recovery. Only transient telecom/gateway failures warrant retries and circuit protection.

### 2.4 Retry Policy with Exponential Backoff and Jitter
- **Schedule**: Max 1 retry (`maxRetries = 1`).
- **Formula**: `delay = baseDelayMs (1,000ms) + Math.floor(Math.random() * 250ms)`.
- **Rationale**: Keeps total worst-case retry time bounded within ~6.5 seconds (initial 5s timeout or fast fail + 1.25s backoff + retry), preventing prolonged background task execution.

### 2.5 POS Transaction Isolation Guarantee
- **Decision**: Point-of-Sale checkout actions execute database commits (`insertSale`, `deductStock`, `createPayment`) **FIRST**.
- SMS notifications are dispatched asynchronously via `dispatchSmsSafe` wrapped in a non-blocking `try...catch`.
- If SMS dispatch returns `{ success: false }`, the sale is still committed, the receipt displays immediately, and a non-blocking notification informs the cashier: *"Transaction saved. SMS notification failed or queued."*

---

## 3. Technology Stack Alignment

- **Runtime**: Next.js 16 (App Router), Node.js native `fetch`, native `AbortController`.
- **Testing**: Node.js built-in test runner (`node --test`), TypeScript (`--experimental-strip-types`), zero external test runner dependencies.
- **Tokens & UI**: ARLQ CSS variables in `app/globals.css`, `lib/tokens.ts`, zero hardcoded hex colors.
