import { dispatchGatewaySms, type UnifiedSmsDispatchResult } from './sms-gateway-router.ts';
import type { PhilSmsSendResult, PhilSmsErrorCode } from './philsms-contracts.ts';
import type { TextBeeErrorCode, TextBeeSendResult } from './textbee-contracts.ts';
import type { SmsDispatchPayload } from './sms-contracts.ts';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export type ResilienceErrorCode =
  | 'TIMEOUT'
  | 'CIRCUIT_OPEN'
  | 'GATEWAY_ERROR'
  | 'INVALID_INPUT';

export type SmsGateway = 'PHILSMS' | 'TEXTBEE' | string;

export interface CircuitBreakerConfig {
  /** Maximum consecutive failures before tripping from CLOSED to OPEN. Default: 3 */
  failureThreshold?: number;
  /** Cooldown duration in ms before shifting from OPEN to HALF_OPEN. Default: 60,000ms */
  cooldownMs?: number;
  /** Request timeout deadline in ms before aborting with TIMEOUT. Default: 5,000ms */
  timeoutMs?: number;
  /** Maximum retry attempts for transient errors. Default: 1 */
  maxRetries?: number;
  /** Base delay in ms for exponential backoff. Default: 1,000ms */
  baseRetryDelayMs?: number;
  /** Random jitter ceiling in ms added to backoff. Default: 250ms */
  jitterMs?: number;
  /** Clock injection provider for deterministic testing. Default: Date.now */
  nowFn?: () => number;
}

export interface SafeSmsDispatchOptions extends CircuitBreakerConfig {
  gateway?: SmsGateway;
}

export interface SafeSmsDispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: ResilienceErrorCode;
  circuitState: CircuitState;
  durationMs: number;
  retryCount?: number;
  rawResponse?: unknown;
}

export interface CircuitBreakerMetrics {
  state: CircuitState;
  consecutiveFailures: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  totalTrips: number;
}

/**
 * Custom error indicating an SMS gateway HTTP request timed out.
 */
export class SmsTimeoutError extends Error {
  constructor(message = 'SMS dispatch timed out after 5000ms') {
    super(message);
    this.name = 'SmsTimeoutError';
  }
}

/**
 * Custom error indicating the circuit breaker is currently OPEN.
 */
export class CircuitOpenError extends Error {
  constructor(message = 'Circuit breaker is OPEN. Outbound SMS suppressed.') {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

/**
 * Robust Circuit Breaker state machine protecting system operations
 * from external SMS carrier outages and latency degradation.
 */
export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private consecutiveFailures = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private totalTrips = 0;
  private probeInFlight = false;
  private config: Required<CircuitBreakerConfig>;

  constructor(config?: CircuitBreakerConfig) {
    this.config = {
      failureThreshold: config?.failureThreshold ?? 3,
      cooldownMs: config?.cooldownMs ?? 60000,
      timeoutMs: config?.timeoutMs ?? 5000,
      maxRetries: config?.maxRetries ?? 1,
      baseRetryDelayMs: config?.baseRetryDelayMs ?? 1000,
      jitterMs: config?.jitterMs ?? 250,
      nowFn: config?.nowFn ?? Date.now,
    };
  }

  public getConfig(): Required<CircuitBreakerConfig> {
    return { ...this.config };
  }

  /**
   * Resolves the effective circuit state taking into account cooldown expiry.
   */
  public getState(): CircuitState {
    if (this.state === 'OPEN') {
      const now = this.config.nowFn();
      const lastFail = this.lastFailureTime ?? 0;
      if (now - lastFail >= this.config.cooldownMs) {
        this.state = 'HALF_OPEN';
      }
    }
    return this.state;
  }

  public getFailureCount(): number {
    return this.consecutiveFailures;
  }

  public getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.getState(),
      consecutiveFailures: this.consecutiveFailures,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalTrips: this.totalTrips,
    };
  }

  /**
   * Determines if a request is permitted through the circuit.
   * In HALF_OPEN, allows exactly 1 trial probe in flight.
   */
  public canExecute(): boolean {
    const currentState = this.getState();
    if (currentState === 'CLOSED') {
      return true;
    }
    if (currentState === 'OPEN') {
      return false;
    }
    // HALF_OPEN
    if (!this.probeInFlight) {
      this.probeInFlight = true;
      return true;
    }
    return false;
  }

  /**
   * Registers a successful dispatch, clearing failure counts and restoring CLOSED state.
   */
  public recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.lastSuccessTime = this.config.nowFn();
    this.state = 'CLOSED';
    this.probeInFlight = false;
  }

  /**
   * Registers a transient gateway failure.
   * If in HALF_OPEN, immediately trips back to OPEN.
   * If in CLOSED, increments consecutive failures and trips if threshold reached.
   */
  public recordFailure(): void {
    const now = this.config.nowFn();
    this.lastFailureTime = now;

    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.totalTrips += 1;
      this.probeInFlight = false;
      return;
    }

    if (this.state === 'CLOSED') {
      this.consecutiveFailures += 1;
      if (this.consecutiveFailures >= this.config.failureThreshold) {
        this.state = 'OPEN';
        this.totalTrips += 1;
      }
    }
  }

  /**
   * Manually resets circuit state to initial clean CLOSED state.
   */
  public reset(): void {
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.totalTrips = 0;
    this.probeInFlight = false;
  }
}

/**
 * Global singleton circuit breaker instance for outbound SMS dispatch.
 */
export const smsCircuitBreaker = new CircuitBreaker();

/**
 * Determines whether an error, HTTP status code, or gateway error code represents
 * a transient/retryable condition vs a permanent client/auth mistake.
 */
export function isRetryableError(
  errorOrStatus?: unknown,
  errorCode?: PhilSmsErrorCode | TextBeeErrorCode | string
): boolean {
  // Non-retryable HTTP client & configuration errors
  if (typeof errorOrStatus === 'number') {
    if ([400, 401, 402, 404, 422].includes(errorOrStatus)) {
      return false;
    }
    if ([429, 500, 502, 503, 504].includes(errorOrStatus)) {
      return true;
    }
  }

  // Gateway domain error codes
  if (errorCode) {
    if (
      [
        'GATEWAY_BAD_REQUEST',
        'GATEWAY_AUTH_ERROR',
        'INSUFFICIENT_CREDITS',
        'INVALID_RECIPIENT_MOBILE',
        'INVALID_INPUT',
        'DEVICE_NOT_FOUND',
      ].includes(errorCode)
    ) {
      return false;
    }
    if (
      [
        'NETWORK_UNREACHABLE',
        'GATEWAY_RATE_LIMITED',
        'TIMEOUT',
        'DEVICE_OFFLINE',
        'GATEWAY_SERVER_ERROR',
      ].includes(errorCode)
    ) {
      return true;
    }
  }

  // Error instance checks
  if (errorOrStatus instanceof SmsTimeoutError) {
    return true;
  }
  if (errorOrStatus instanceof Error) {
    const msg = errorOrStatus.message.toLowerCase();
    const name = errorOrStatus.name;
    if (
      name === 'AbortError' ||
      name === 'TimeoutError' ||
      msg.includes('abort') ||
      msg.includes('timeout') ||
      msg.includes('econnreset') ||
      msg.includes('enotfound') ||
      msg.includes('fetch failed') ||
      msg.includes('network') ||
      msg.includes('offline') ||
      msg.includes('disconnected')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Wraps an async operation in an AbortController deadline timer.
 */
export async function executeWithTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number
): Promise<T> {
  const controller = new AbortController();
  let timer: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new SmsTimeoutError(`SMS dispatch timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([fn(controller.signal), timeoutPromise]);
    return result;
  } catch (err) {
    if (
      controller.signal.aborted ||
      (err instanceof Error &&
        (err.name === 'AbortError' || err.name === 'TimeoutError' || err instanceof SmsTimeoutError))
    ) {
      throw new SmsTimeoutError(`SMS dispatch timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

/**
 * Calculates exponential backoff delay with random jitter.
 */
export function calculateBackoffDelay(
  attempt: number,
  baseMs = 1000,
  jitterMaxMs = 250
): number {
  const exponential = baseMs * Math.pow(2, attempt);
  const jitter = Math.floor(Math.random() * (jitterMaxMs + 1));
  return exponential + jitter;
}

/**
 * Promise-based sleep helper.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Non-blocking safe SMS dispatcher wrapper.
 * Integrates:
 * - Multi-gateway support (PHILSMS or TEXTBEE)
 * - Immediate fast-fail when Circuit Breaker is OPEN (< 1ms)
 * - 5,000ms AbortController timeout protection
 * - 1-attempt exponential backoff retry for transient gateway / network errors
 * - Non-retryable error fast-fail (400, 401, 402, 404, 422)
 * - Guaranteed non-throwing envelope return (`SafeSmsDispatchResult`)
 */
export async function dispatchSmsSafe(
  payload: SmsDispatchPayload,
  options?: Partial<SafeSmsDispatchOptions>,
  customBreaker?: CircuitBreaker
): Promise<SafeSmsDispatchResult> {
  const startTime = Date.now();
  const breaker = customBreaker || smsCircuitBreaker;
  const cfg = { ...breaker.getConfig(), ...options };
  const targetGateway = (
    options?.gateway ||
    process.env.SMS_GATEWAY_PROVIDER ||
    process.env.ACTIVE_SMS_GATEWAY ||
    'PHILSMS'
  ).toUpperCase();

  // 1. Client-side input validation guard
  if (!payload || !payload.recipientMobile || !payload.recipientMobile.trim()) {
    return {
      success: false,
      errorCode: 'INVALID_INPUT',
      error: 'Invalid recipient mobile number',
      circuitState: breaker.getState(),
      durationMs: Date.now() - startTime,
      retryCount: 0,
    };
  }

  if (!payload.message || !payload.message.trim()) {
    return {
      success: false,
      errorCode: 'INVALID_INPUT',
      error: 'SMS message text is required',
      circuitState: breaker.getState(),
      durationMs: Date.now() - startTime,
      retryCount: 0,
    };
  }

  // 2. Circuit Breaker Fast-Fail Check (< 1ms)
  if (!breaker.canExecute()) {
    return {
      success: false,
      errorCode: 'CIRCUIT_OPEN',
      error: 'Circuit breaker is OPEN. Outbound SMS suppressed.',
      circuitState: breaker.getState(),
      durationMs: Date.now() - startTime,
      retryCount: 0,
    };
  }

  let lastError: Error | null = null;
  let lastResult: UnifiedSmsDispatchResult | PhilSmsSendResult | TextBeeSendResult | null = null;
  const maxRetries = cfg.maxRetries ?? 1;
  const timeoutMs = cfg.timeoutMs ?? 5000;
  let attemptsMade = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    attemptsMade = attempt;

    try {
      const result = await executeWithTimeout(
        async (signal) => {
          return dispatchGatewaySms({
            recipient: payload.recipientMobile,
            message: payload.message,
            signal,
            provider: targetGateway,
          });
        },
        timeoutMs
      );

      lastResult = result;

      if (result.success) {
        breaker.recordSuccess();
        return {
          success: true,
          messageId: result.messageId,
          circuitState: breaker.getState(),
          durationMs: Date.now() - startTime,
          retryCount: attempt,
          rawResponse: result.rawResponse,
        };
      }

      // Check if gateway error is retryable
      const retryable = isRetryableError(
        (result.rawResponse as { status?: number })?.status,
        result.errorCode
      );

      if (!retryable) {
        // Non-transient failure: do not trip breaker, do not retry
        const isInputError =
          result.errorCode === 'INVALID_RECIPIENT_MOBILE' ||
          (result.errorCode as string) === 'INVALID_INPUT';
        const mappedCode: ResilienceErrorCode = isInputError ? 'INVALID_INPUT' : 'GATEWAY_ERROR';

        return {
          success: false,
          errorCode: mappedCode,
          error: result.errorMessage || 'SMS Gateway error',
          circuitState: breaker.getState(),
          durationMs: Date.now() - startTime,
          retryCount: attempt,
          rawResponse: result.rawResponse,
        };
      }

      // Transient failure: check if we have retries remaining
      if (attempt < maxRetries) {
        const delay = calculateBackoffDelay(attempt, cfg.baseRetryDelayMs, cfg.jitterMs);
        await sleep(delay);
        continue;
      } else {
        // Retries exhausted
        breaker.recordFailure();
        return {
          success: false,
          errorCode: result.errorCode === 'TIMEOUT' ? 'TIMEOUT' : 'GATEWAY_ERROR',
          error: result.errorMessage || 'SMS Gateway transmission failure',
          circuitState: breaker.getState(),
          durationMs: Date.now() - startTime,
          retryCount: attempt,
          rawResponse: result.rawResponse,
        };
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const isTimeout =
        lastError instanceof SmsTimeoutError ||
        lastError.name === 'AbortError' ||
        lastError.name === 'TimeoutError' ||
        lastError.message.includes('timeout');

      if (attempt < maxRetries) {
        const delay = calculateBackoffDelay(attempt, cfg.baseRetryDelayMs, cfg.jitterMs);
        await sleep(delay);
        continue;
      } else {
        // Retries exhausted for exception
        breaker.recordFailure();
        return {
          success: false,
          errorCode: isTimeout ? 'TIMEOUT' : 'GATEWAY_ERROR',
          error: lastError.message,
          circuitState: breaker.getState(),
          durationMs: Date.now() - startTime,
          retryCount: attempt,
        };
      }
    }
  }

  // Fallback safe envelope
  breaker.recordFailure();
  return {
    success: false,
    errorCode: 'GATEWAY_ERROR',
    error: lastError?.message || lastResult?.errorMessage || 'SMS dispatch failed',
    circuitState: breaker.getState(),
    durationMs: Date.now() - startTime,
    retryCount: attemptsMade,
  };
}
