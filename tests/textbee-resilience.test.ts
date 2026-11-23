import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  CircuitBreaker,
  dispatchSmsSafe,
  isRetryableError,
  smsCircuitBreaker,
} from '../lib/services/sms-resilience.ts';
import {
  sendSmsViaTextBee,
  _setMockTextBeeSendHandler,
  _resetTextBeeSendMock,
} from '../lib/services/textbee-adapter.ts';
import {
  dispatchSms,
  _resetSmsHistory,
} from '../lib/services/sms-service.ts';
import { _getInMemorySmsAuditLogs, _resetSmsAuditLogs } from '../lib/services/sms-audit-service.ts';

describe('Feature ARL-42: TextBee SMS Resilience Circuit Breaker & Audit Ledger', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.TEXTBEE_MOCK_DISPATCH = 'true';
    _resetTextBeeSendMock();
    _resetSmsHistory();
    _resetSmsAuditLogs();
    smsCircuitBreaker.reset();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    _resetTextBeeSendMock();
    _resetSmsHistory();
    _resetSmsAuditLogs();
    smsCircuitBreaker.reset();
  });

  describe('1. Error Classification & Resilience Mapping', () => {
    it('classifies DEVICE_OFFLINE as transient and retryable', () => {
      assert.equal(isRetryableError(503, 'DEVICE_OFFLINE'), true);
      assert.equal(isRetryableError(undefined, 'DEVICE_OFFLINE'), true);
      assert.equal(isRetryableError(new Error('Android device offline')), true);
    });

    it('classifies GATEWAY_RATE_LIMITED and GATEWAY_SERVER_ERROR as retryable', () => {
      assert.equal(isRetryableError(429, 'GATEWAY_RATE_LIMITED'), true);
      assert.equal(isRetryableError(500, 'GATEWAY_SERVER_ERROR'), true);
      assert.equal(isRetryableError(502, 'GATEWAY_SERVER_ERROR'), true);
      assert.equal(isRetryableError(504, 'GATEWAY_SERVER_ERROR'), true);
    });

    it('classifies network timeouts and socket disconnects as retryable', () => {
      assert.equal(isRetryableError(undefined, 'TIMEOUT'), true);
      assert.equal(isRetryableError(undefined, 'NETWORK_UNREACHABLE'), true);
      assert.equal(isRetryableError(new Error('fetch failed: network socket reset')), true);
    });

    it('classifies non-transient client and auth errors as non-retryable', () => {
      assert.equal(isRetryableError(401, 'GATEWAY_AUTH_ERROR'), false);
      assert.equal(isRetryableError(400, 'GATEWAY_BAD_REQUEST'), false);
      assert.equal(isRetryableError(404, 'DEVICE_NOT_FOUND'), false);
      assert.equal(isRetryableError(422, 'INVALID_RECIPIENT_MOBILE'), false);
    });
  });

  describe('2. TextBee Adapter Dispatch & Mock Operations', () => {
    it('generates deterministic mock result when TEXTBEE_MOCK_DISPATCH is true', async () => {
      process.env.TEXTBEE_MOCK_DISPATCH = 'true';
      const result = await sendSmsViaTextBee({
        recipient: '09171234567',
        message: 'Your ARLQ overdue balance notice',
      });

      assert.equal(result.success, true);
      assert.ok(result.messageId);
      assert.ok(result.messageId.startsWith('textbee_'));
    });

    it('rejects empty recipient mobile numbers immediately', async () => {
      const result = await sendSmsViaTextBee({
        recipient: '   ',
        message: 'Valid message',
      });

      assert.equal(result.success, false);
      assert.equal(result.errorCode, 'INVALID_RECIPIENT_MOBILE');
    });

    it('rejects empty message body immediately', async () => {
      const result = await sendSmsViaTextBee({
        recipient: '09171234567',
        message: '   ',
      });

      assert.equal(result.success, false);
      assert.equal(result.errorCode, 'GATEWAY_BAD_REQUEST');
    });
  });

  describe('3. Circuit Breaker Device Disconnect Protection & Fast-Fail', () => {
    it('trips circuit breaker from CLOSED to OPEN after 3 consecutive DEVICE_OFFLINE failures', async () => {
      let callCount = 0;
      _setMockTextBeeSendHandler(async () => {
        callCount++;
        return {
          success: false,
          errorCode: 'DEVICE_OFFLINE',
          errorMessage: 'Android phone disconnected or battery depleted',
          rawResponse: { status: 503 },
        };
      });

      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        baseRetryDelayMs: 1,
        jitterMs: 0,
      });

      // Strike 1
      const res1 = await dispatchSmsSafe(
        { recipientMobile: '09171112222', recipientType: 'CUSTOMER', message: 'Reminder 1' },
        { gateway: 'TEXTBEE' },
        breaker
      );
      assert.equal(res1.success, false);
      assert.equal(res1.errorCode, 'GATEWAY_ERROR');
      assert.equal(breaker.getState(), 'CLOSED');
      assert.equal(breaker.getFailureCount(), 1);

      // Strike 2
      const res2 = await dispatchSmsSafe(
        { recipientMobile: '09171112222', recipientType: 'CUSTOMER', message: 'Reminder 2' },
        { gateway: 'TEXTBEE' },
        breaker
      );
      assert.equal(res2.success, false);
      assert.equal(breaker.getState(), 'CLOSED');
      assert.equal(breaker.getFailureCount(), 2);

      // Strike 3 -> Trips to OPEN
      const res3 = await dispatchSmsSafe(
        { recipientMobile: '09171112222', recipientType: 'CUSTOMER', message: 'Reminder 3' },
        { gateway: 'TEXTBEE' },
        breaker
      );
      assert.equal(res3.success, false);
      assert.equal(breaker.getState(), 'OPEN');
      assert.equal(breaker.getFailureCount(), 3);
      assert.equal(breaker.canExecute(), false);

      // Strike 4 -> Immediate fast-fail in < 1ms without invoking adapter
      const callsBefore = callCount;
      const t0 = Date.now();
      const res4 = await dispatchSmsSafe(
        { recipientMobile: '09171112222', recipientType: 'CUSTOMER', message: 'Reminder 4' },
        { gateway: 'TEXTBEE' },
        breaker
      );
      const elapsed = Date.now() - t0;

      assert.equal(res4.success, false);
      assert.equal(res4.errorCode, 'CIRCUIT_OPEN');
      assert.equal(res4.error, 'Circuit breaker is OPEN. Outbound SMS suppressed.');
      assert.equal(callCount, callsBefore); // No new network call was dispatched
      assert.ok(elapsed <= 25, `Expected fast-fail in < 25ms, got ${elapsed}ms`);
    });

    it('resets consecutive failures to 0 upon successful TextBee dispatch', async () => {
      let fail = true;
      _setMockTextBeeSendHandler(async () => {
        if (fail) {
          return {
            success: false,
            errorCode: 'DEVICE_OFFLINE',
            errorMessage: 'Phone battery empty',
            rawResponse: { status: 503 },
          };
        }
        return {
          success: true,
          messageId: 'textbee_uuid_success',
        };
      });

      const breaker = new CircuitBreaker({
        failureThreshold: 3,
        baseRetryDelayMs: 1,
        jitterMs: 0,
      });

      // 2 failures
      await dispatchSmsSafe(
        { recipientMobile: '09171112222', recipientType: 'CUSTOMER', message: 'Msg 1' },
        { gateway: 'TEXTBEE' },
        breaker
      );
      await dispatchSmsSafe(
        { recipientMobile: '09171112222', recipientType: 'CUSTOMER', message: 'Msg 2' },
        { gateway: 'TEXTBEE' },
        breaker
      );
      assert.equal(breaker.getFailureCount(), 2);

      // Now recover
      fail = false;
      const recovery = await dispatchSmsSafe(
        { recipientMobile: '09171112222', recipientType: 'CUSTOMER', message: 'Msg 3' },
        { gateway: 'TEXTBEE' },
        breaker
      );
      assert.equal(recovery.success, true);
      assert.equal(breaker.getState(), 'CLOSED');
      assert.equal(breaker.getFailureCount(), 0);
    });
  });

  describe('4. Strict Timeout Protection via AbortController', () => {
    it('aborts stalled TextBee requests and records TIMEOUT', async () => {
      _setMockTextBeeSendHandler(async ({ signal }) => {
        return new Promise((resolve, reject) => {
          signal?.addEventListener('abort', () => {
            reject(new Error('AbortError: Request aborted'));
          });
        });
      });

      const breaker = new CircuitBreaker({
        timeoutMs: 50,
        maxRetries: 0,
        baseRetryDelayMs: 1,
      });

      const res = await dispatchSmsSafe(
        { recipientMobile: '09171112222', recipientType: 'CUSTOMER', message: 'Stalled test' },
        { gateway: 'TEXTBEE', timeoutMs: 50 },
        breaker
      );

      assert.equal(res.success, false);
      assert.equal(res.errorCode, 'TIMEOUT');
      assert.equal(breaker.getFailureCount(), 1);
    });
  });

  describe('5. Non-Retryable Error Fast-Fail (No Breaker Tripping)', () => {
    it('fails immediately on HTTP 401 Auth Error without retries or tripping breaker', async () => {
      let callCount = 0;
      _setMockTextBeeSendHandler(async () => {
        callCount++;
        return {
          success: false,
          errorCode: 'GATEWAY_AUTH_ERROR',
          errorMessage: 'Invalid TextBee API key',
          rawResponse: { status: 401 },
        };
      });

      const breaker = new CircuitBreaker({ failureThreshold: 3, maxRetries: 2 });
      const res = await dispatchSmsSafe(
        { recipientMobile: '09171112222', recipientType: 'CUSTOMER', message: 'Auth test' },
        { gateway: 'TEXTBEE' },
        breaker
      );

      assert.equal(res.success, false);
      assert.equal(res.errorCode, 'GATEWAY_ERROR');
      assert.equal(callCount, 1); // Exactly 1 attempt, zero retries
      assert.equal(breaker.getFailureCount(), 0); // Breaker not tripped
      assert.equal(breaker.getState(), 'CLOSED');
    });

    it('fails immediately on invalid mobile input format', async () => {
      const breaker = new CircuitBreaker();
      const res = await dispatchSmsSafe(
        { recipientMobile: '', recipientType: 'CUSTOMER', message: 'Input test' },
        { gateway: 'TEXTBEE' },
        breaker
      );

      assert.equal(res.success, false);
      assert.equal(res.errorCode, 'INVALID_INPUT');
      assert.equal(breaker.getFailureCount(), 0);
    });
  });

  describe('6. Half-Open State & Recovery Probing', () => {
    it('allows 1 probe in HALF_OPEN and restores CLOSED on success', async () => {
      let mockTime = 100000;
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        cooldownMs: 60000,
        nowFn: () => mockTime,
        baseRetryDelayMs: 1,
      });

      let fail = true;
      _setMockTextBeeSendHandler(async () => {
        if (fail) {
          return {
            success: false,
            errorCode: 'DEVICE_OFFLINE',
            errorMessage: 'Offline',
            rawResponse: { status: 503 },
          };
        }
        return { success: true, messageId: 'probe_success_id' };
      });

      // Trip to OPEN
      await dispatchSmsSafe(
        { recipientMobile: '09171112222', recipientType: 'CUSTOMER', message: 'Trip 1' },
        { gateway: 'TEXTBEE' },
        breaker
      );
      await dispatchSmsSafe(
        { recipientMobile: '09171112222', recipientType: 'CUSTOMER', message: 'Trip 2' },
        { gateway: 'TEXTBEE' },
        breaker
      );
      assert.equal(breaker.getState(), 'OPEN');

      // Fast-fail before cooldown
      const fastFail = await dispatchSmsSafe(
        { recipientMobile: '09171112222', recipientType: 'CUSTOMER', message: 'Early call' },
        { gateway: 'TEXTBEE' },
        breaker
      );
      assert.equal(fastFail.errorCode, 'CIRCUIT_OPEN');

      // Advance clock past cooldown
      mockTime += 60001;
      assert.equal(breaker.getState(), 'HALF_OPEN');

      // Probe succeeds
      fail = false;
      const probeRes = await dispatchSmsSafe(
        { recipientMobile: '09171112222', recipientType: 'CUSTOMER', message: 'Probe trial' },
        { gateway: 'TEXTBEE' },
        breaker
      );

      assert.equal(probeRes.success, true);
      assert.equal(probeRes.messageId, 'probe_success_id');
      assert.equal(breaker.getState(), 'CLOSED');
      assert.equal(breaker.getFailureCount(), 0);
    });

    it('immediately re-trips back to OPEN if HALF_OPEN probe fails', async () => {
      let mockTime = 100000;
      const breaker = new CircuitBreaker({
        failureThreshold: 2,
        cooldownMs: 60000,
        nowFn: () => mockTime,
        baseRetryDelayMs: 1,
      });

      _setMockTextBeeSendHandler(async () => {
        return {
          success: false,
          errorCode: 'DEVICE_OFFLINE',
          errorMessage: 'Still offline',
          rawResponse: { status: 503 },
        };
      });

      // Trip to OPEN
      await dispatchSmsSafe(
        { recipientMobile: '09171112222', recipientType: 'CUSTOMER', message: 'Trip 1' },
        { gateway: 'TEXTBEE' },
        breaker
      );
      await dispatchSmsSafe(
        { recipientMobile: '09171112222', recipientType: 'CUSTOMER', message: 'Trip 2' },
        { gateway: 'TEXTBEE' },
        breaker
      );
      assert.equal(breaker.getState(), 'OPEN');

      // Advance past cooldown into HALF_OPEN
      mockTime += 60001;
      assert.equal(breaker.getState(), 'HALF_OPEN');

      // Probe fails
      const probeRes = await dispatchSmsSafe(
        { recipientMobile: '09171112222', recipientType: 'CUSTOMER', message: 'Probe fail' },
        { gateway: 'TEXTBEE' },
        breaker
      );

      assert.equal(probeRes.success, false);
      assert.equal(breaker.getState(), 'OPEN');
    });
  });

  describe('7. Immutable Audit Ledger Persistence with TEXTBEE Tag', () => {
    it('records audit entry with gateway_name = "TEXTBEE" on successful dispatch', async () => {
      _setMockTextBeeSendHandler(async () => ({
        success: true,
        messageId: 'textbee_uuid_audit_test_99',
      }));

      const res = await dispatchSms(
        {
          recipientMobile: '09171234567',
          recipientType: 'CUSTOMER',
          message: 'Overdue utang notification for Juan',
        },
        null,
        { gateway: 'TEXTBEE' }
      );

      assert.equal(res.success, true);
      assert.equal(res.messageId, 'textbee_uuid_audit_test_99');

      const logs = _getInMemorySmsAuditLogs();
      assert.equal(logs.length, 1);
      const log = logs[0];

      assert.equal(log.gatewayName, 'TEXTBEE');
      assert.equal(log.gateway_name, 'TEXTBEE');
      assert.equal(log.status, 'SENT');
      assert.equal(log.gatewayMessageId, 'textbee_uuid_audit_test_99');
      assert.equal(log.recipientMobile, '09171234567');
      assert.ok(typeof log.latencyMs === 'number' && log.latencyMs >= 0);
      assert.equal(log.executionLatencyMs, log.latencyMs);
    });

    it('records audit entry with gateway_name = "TEXTBEE" and status FAILED on device offline', async () => {
      _setMockTextBeeSendHandler(async () => ({
        success: false,
        errorCode: 'DEVICE_OFFLINE',
        errorMessage: 'Android phone disconnected',
        rawResponse: { status: 503 },
      }));

      const res = await dispatchSms(
        {
          recipientMobile: '09171234567',
          recipientType: 'ADMIN',
          message: 'Daily sweep summary',
        },
        null,
        { gateway: 'TEXTBEE' }
      );

      assert.equal(res.success, false);

      const logs = _getInMemorySmsAuditLogs();
      assert.equal(logs.length, 1);
      const log = logs[0];

      assert.equal(log.gatewayName, 'TEXTBEE');
      assert.equal(log.status, 'FAILED');
      assert.ok(log.errorReason?.includes('disconnected') || log.errorReason?.includes('SMS Gateway'));
      assert.ok(typeof log.latencyMs === 'number' && log.latencyMs >= 0);
    });

    it('records audit entry with status SKIPPED when phone number is malformed', async () => {
      const res = await dispatchSms(
        {
          recipientMobile: 'not-a-valid-number',
          recipientType: 'CUSTOMER',
          message: 'Malformed number test',
        },
        null,
        { gateway: 'TEXTBEE' }
      );

      assert.equal(res.success, false);

      const logs = _getInMemorySmsAuditLogs();
      assert.equal(logs.length, 1);
      const log = logs[0];

      assert.equal(log.gatewayName, 'TEXTBEE');
      assert.equal(log.status, 'SKIPPED');
      assert.ok(log.errorReason?.includes('Invalid'));
      assert.equal(log.latencyMs, 0);
    });
  });
});
