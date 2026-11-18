import type { SmsDispatchPayload } from '@/lib/services/sms-contracts';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export type ResilienceErrorCode =
  | 'TIMEOUT'
  | 'CIRCUIT_OPEN'
  | 'GATEWAY_ERROR'
  | 'INVALID_INPUT';

export interface CircuitBreakerConfig {
  /** Maximum consecutive failures before tripping from CLOSED to OPEN. Default: 3 */
  failureThreshold?: number;
  /** Milliseconds in OPEN state before shifting to HALF_OPEN. Default: 60,000ms */
  cooldownMs?: number;
  /** Request timeout limit in ms before aborting with TIMEOUT. Default: 5,000ms */
  timeoutMs?: number;
  /** Maximum retry attempts for transient errors. Default: 1 */
  maxRetries?: number;
  /** Base delay in ms for exponential backoff. Default: 1,000ms */
  baseRetryDelayMs?: number;
  /** Clock provider for deterministic unit testing. Default: Date.now */
  nowFn?: () => number;
}

export interface SafeSmsDispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: ResilienceErrorCode;
  circuitState: CircuitState;
  durationMs: number;
  retryCount?: number;
}

export interface CircuitBreakerMetrics {
  state: CircuitState;
  consecutiveFailures: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  totalTrips: number;
}
