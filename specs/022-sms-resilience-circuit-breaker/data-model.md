# Data Model: SMS Gateway Resilience & Circuit Breaker (ARL-25)

## 1. Circuit Breaker State Entity

```typescript
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  /** Maximum consecutive failures before tripping to OPEN. Default: 3 */
  failureThreshold: number;
  /** Cooldown time in ms before transitioning from OPEN to HALF_OPEN. Default: 60,000ms */
  cooldownMs: number;
  /** Request timeout limit in ms before aborting with TIMEOUT. Default: 5,000ms */
  timeoutMs: number;
  /** Maximum retry attempts for transient errors. Default: 1 */
  maxRetries: number;
  /** Base delay in ms for exponential backoff. Default: 1,000ms */
  baseRetryDelayMs: number;
  /** Clock provider function for deterministic testing. Default: Date.now */
  nowFn?: () => number;
}

export interface CircuitBreakerMetrics {
  state: CircuitState;
  consecutiveFailures: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  totalTrips: number;
}
```

## 2. Dispatch Result Envelopes

```typescript
export type ResilienceErrorCode =
  | 'TIMEOUT'
  | 'CIRCUIT_OPEN'
  | 'GATEWAY_ERROR'
  | 'INVALID_INPUT';

export interface SafeSmsDispatchResult {
  /** True if the SMS was successfully dispatched or accepted by gateway/mock */
  success: boolean;
  /** Gateway or mock message identifier */
  messageId?: string;
  /** Clean error message for user-facing logs or toasts */
  error?: string;
  /** Standardized resilience error code */
  errorCode?: ResilienceErrorCode;
  /** State of the circuit breaker at the conclusion of the dispatch attempt */
  circuitState: CircuitState;
  /** Total elapsed time in milliseconds for the operation */
  durationMs: number;
  /** Number of retry attempts executed */
  retryCount?: number;
}
```

## 3. State Machine Transitions

```
                    [Initial State]
                           |
                           v
                     +------------+
        +----------->|   CLOSED   |<-------------------------+
        |            +------------+                          |
        |                  |                                 |
1 Success                  | 3 Consecutive Failures          | 1 Probe Success
        |                  v                                 |
        |            +------------+                          |
        |            |    OPEN    |                          |
        |            +------------+                          |
        |                  |                                 |
        |                  | Cooldown Window (60s) Expires   |
        |                  v                                 |
        |            +------------+                          |
        |            | HALF_OPEN  |                          |
        |            +------------+                          |
        |                  |                                 |
        +------------------+---------------------------------+
                           |
                           | 1 Probe Failure
                           v
                       (Re-arms OPEN for 60s)
```
