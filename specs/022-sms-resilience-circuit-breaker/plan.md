# Implementation Plan: SMS Gateway Resilience & Circuit Breaker (ARL-25)

## 1. Architectural Overview & Boundaries

```mermaid
flowchart TD
    A[POS Checkout / Overdue Sweep / Manual Nudge] --> B[sms-service.ts]
    B --> C[dispatchSmsSafe in sms-resilience.ts]
    C --> D{Circuit State?}
    D -- OPEN (<60s) --> E[Fast-fail immediately &lt;1ms\nerrorCode: CIRCUIT_OPEN]
    D -- CLOSED or HALF_OPEN probe --> F[fetchWithTimeoutAndRetry\nAbortController 5000ms]
    F --> G[PhilSMS Adapter / Live Gateway]
    G -- 200 OK --> H[Record Success\nReset fail count\nReturn SafeSmsDispatchResult]
    G -- 502/503/504 or Timeout --> I{Retry Count &lt; 1?}
    I -- Yes --> J[Delay 1s + jitter 0-250ms\nRetry probe]
    I -- No --> K[Record Failure\nIf failures &gt;= 3 -> OPEN\nReturn errorCode: TIMEOUT/GATEWAY_ERROR]
    G -- 400/401/402/422 --> L[Immediate fail\nNo retry, No trip\nReturn errorCode: INVALID_INPUT/GATEWAY_ERROR]
```

## 2. File Modification & Creation Inventory

| File Path | Action | Description |
| :--- | :--- | :--- |
| `lib/services/sms-resilience.ts` | Create | Implements `CircuitBreaker` class, `fetchWithTimeoutAndRetry`, `dispatchSmsSafe`, and default singleton `smsCircuitBreaker`. |
| `lib/services/sms-service.ts` | Modify | Connects `dispatchSms` with `dispatchSmsSafe` to ensure zero-crash execution across all existing dispatch paths. |
| `tests/sms-resilience.test.ts` | Create | BDD unit test suite covering timeout aborts, 3-strike circuit tripping, 60s cooldown recovery, probe pass/fail, and non-blocking POS simulation. |
| `tests/unit/sms-resilience.test.ts` | Create | Re-exports or symlinks to `tests/sms-resilience.test.ts` for directory consistency with Jira DoD. |

## 3. Test Strategy

1. **Timeout Handling**:
   - Mock a fetch handler that delays 6,000ms.
   - Verify `AbortController` triggers at 5,000ms and returns `errorCode: 'TIMEOUT'` in ~5,000ms without throwing uncaught errors.
2. **Circuit Breaker State Machine**:
   - 3 consecutive gateway failures trip circuit to `OPEN`.
   - Verified that subsequent calls in `OPEN` return in < 2ms with `errorCode: 'CIRCUIT_OPEN'`.
   - Simulated 60s cooldown allows 1 probe in `HALF_OPEN`.
   - Successful probe restores `CLOSED`.
   - Failed probe returns to `OPEN` for another 60s.
3. **Transient Retry & Jitter**:
   - Initial HTTP 502 followed by HTTP 200 succeeds after 1 retry.
   - Non-retryable HTTP 401 / 402 fails on initial attempt without retry.
4. **POS Transaction Decoupling**:
   - Simulates POS checkout with database insert + SMS call.
   - Confirms sale transaction commits even when SMS fails or times out.
