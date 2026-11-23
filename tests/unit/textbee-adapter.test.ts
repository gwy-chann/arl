import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePhilippineMobileForTextBee,
  sendSmsViaTextBee,
  _getTextBeeMockHistory,
  _resetTextBeeMockHistory,
  _setMockTextBeeSendHandler,
  _resetTextBeeSendMock,
} from '../../lib/services/textbee-adapter.ts';
import { textBeeSendResultSchema } from '../../lib/services/textbee-contracts.ts';

describe('Feature ARL-40: TextBee REST Gateway Client Adapter & Phone Normalizer', () => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
    _resetTextBeeMockHistory();
    _resetTextBeeSendMock();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    globalThis.fetch = originalFetch;
    _resetTextBeeMockHistory();
    _resetTextBeeSendMock();
  });

  describe('1. Philippine Mobile Number Canonicalization Matrix', () => {
    it('canonicalizes standard national 11-digit mobile starting with 09 to +639', () => {
      const canonical = normalizePhilippineMobileForTextBee('09171234567');
      assert.strictEqual(canonical, '+639171234567');
    });

    it('canonicalizes E.164 mobile numbers starting with +639', () => {
      const canonical = normalizePhilippineMobileForTextBee('+639171234567');
      assert.strictEqual(canonical, '+639171234567');
    });

    it('canonicalizes 12-digit international numbers without plus starting with 639', () => {
      const canonical = normalizePhilippineMobileForTextBee('639171234567');
      assert.strictEqual(canonical, '+639171234567');
    });

    it('strips whitespace, dashes, parentheses, and dots from numbers', () => {
      assert.strictEqual(normalizePhilippineMobileForTextBee('(0917) 123-4567'), '+639171234567');
      assert.strictEqual(normalizePhilippineMobileForTextBee('0917 123 4567'), '+639171234567');
      assert.strictEqual(normalizePhilippineMobileForTextBee('+63-917-123-4567'), '+639171234567');
      assert.strictEqual(normalizePhilippineMobileForTextBee('+63 (917) 123.4567'), '+639171234567');
    });

    it('rejects numbers with fewer than 11 digits', () => {
      assert.throws(() => normalizePhilippineMobileForTextBee('0912345'), {
        message: 'Invalid Philippine mobile number format',
      });
      assert.throws(() => normalizePhilippineMobileForTextBee('12345'), {
        message: 'Invalid Philippine mobile number format',
      });
    });

    it('rejects numbers not starting with valid Philippine mobile prefixes (e.g. 08...)', () => {
      assert.throws(() => normalizePhilippineMobileForTextBee('08171234567'), {
        message: 'Invalid Philippine mobile number format',
      });
      assert.throws(() => normalizePhilippineMobileForTextBee('+12025550199'), {
        message: 'Invalid Philippine mobile number format',
      });
    });

    it('rejects empty or non-string inputs', () => {
      assert.throws(() => normalizePhilippineMobileForTextBee(''), {
        message: 'Invalid Philippine mobile number format',
      });
      // @ts-expect-error Testing runtime invalid input
      assert.throws(() => normalizePhilippineMobileForTextBee(null), {
        message: 'Invalid Philippine mobile number format',
      });
      // @ts-expect-error Testing runtime invalid input
      assert.throws(() => normalizePhilippineMobileForTextBee(undefined), {
        message: 'Invalid Philippine mobile number format',
      });
    });
  });

  describe('2. Input Validation in sendSmsViaTextBee', () => {
    it('returns error when recipient is empty or missing', async () => {
      const result = await sendSmsViaTextBee({
        recipient: '   ',
        message: 'Test message',
      });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.gateway, 'TEXTBEE');
      assert.strictEqual(result.errorCode, 'INVALID_RECIPIENT_MOBILE');
      assert.match(result.errorMessage || '', /required/i);
    });

    it('returns error when recipient cannot be normalized', async () => {
      const result = await sendSmsViaTextBee({
        recipient: '08123456789',
        message: 'Test message',
      });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.gateway, 'TEXTBEE');
      assert.strictEqual(result.recipient, '08123456789');
      assert.strictEqual(result.errorCode, 'INVALID_RECIPIENT_MOBILE');
      assert.match(result.errorMessage || '', /invalid.*format/i);
    });

    it('returns error when message body is empty or whitespace', async () => {
      const result = await sendSmsViaTextBee({
        recipient: '09171234567',
        message: '   ',
      });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.gateway, 'TEXTBEE');
      assert.strictEqual(result.recipient, '+639171234567');
      assert.strictEqual(result.errorCode, 'GATEWAY_BAD_REQUEST');
      assert.match(result.errorMessage || '', /cannot be empty/i);
    });
  });

  describe('3. Deterministic Offline Mock Operations', () => {
    it('dispatches deterministically when TEXTBEE_MOCK_DISPATCH="true"', async () => {
      process.env.TEXTBEE_MOCK_DISPATCH = 'true';
      delete process.env.TEXTBEE_API_KEY;

      const result = await sendSmsViaTextBee({
        recipient: '09171234567',
        message: 'Your ARLQ order is confirmed',
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.gateway, 'TEXTBEE');
      assert.strictEqual(result.recipient, '+639171234567');
      assert.ok(result.messageId?.startsWith('textbee_'));

      // Validate Zod schema parse
      const parsed = textBeeSendResultSchema.parse(result);
      assert.strictEqual(parsed.gateway, 'TEXTBEE');

      // Verify mock history entry
      const history = _getTextBeeMockHistory();
      assert.strictEqual(history.length, 1);
      assert.strictEqual(history[0].recipient, '+639171234567');
      assert.strictEqual(history[0].message, 'Your ARLQ order is confirmed');
      assert.strictEqual(history[0].messageId, result.messageId);
    });

    it('falls back to mock mode when TEXTBEE_API_KEY is not configured', async () => {
      delete process.env.TEXTBEE_API_KEY;
      delete process.env.TEXTBEE_MOCK_DISPATCH;

      const result = await sendSmsViaTextBee({
        recipient: '09187654321',
        message: 'Reminder: payment due today',
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.gateway, 'TEXTBEE');
      assert.strictEqual(result.recipient, '+639187654321');
      assert.ok(result.messageId);

      const history = _getTextBeeMockHistory();
      assert.strictEqual(history.length, 1);
    });

    it('supports test override handler injection via _setMockTextBeeSendHandler', async () => {
      _setMockTextBeeSendHandler(async (opts) => ({
        success: true,
        messageId: 'tb_override_999',
        recipient: opts.recipient,
        gateway: 'TEXTBEE',
      }));

      const res = await sendSmsViaTextBee({
        recipient: '09171234567',
        message: 'Overridden',
      });

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.messageId, 'tb_override_999');

      _resetTextBeeSendMock();
    });

    it('clears mock history when _resetTextBeeMockHistory is called', async () => {
      process.env.TEXTBEE_MOCK_DISPATCH = 'true';
      await sendSmsViaTextBee({ recipient: '09171234567', message: 'Msg 1' });
      await sendSmsViaTextBee({ recipient: '09171234567', message: 'Msg 2' });

      assert.strictEqual(_getTextBeeMockHistory().length, 2);
      _resetTextBeeMockHistory();
      assert.strictEqual(_getTextBeeMockHistory().length, 0);
    });
  });

  describe('4. Live Gateway Dispatch & Error Classification', () => {
    it('sends authorized HTTPS POST with x-api-key and E.164 recipient', async () => {
      process.env.TEXTBEE_MOCK_DISPATCH = 'false';
      process.env.TEXTBEE_API_KEY = 'tb_test_key_xyz';
      process.env.TEXTBEE_DEVICE_ID = 'dev_123';

      let calledUrl = '';
      let calledMethod = '';
      let calledHeaders: Record<string, string> = {};
      let calledBody = '';

      globalThis.fetch = async (input, init) => {
        calledUrl = String(input);
        calledMethod = init?.method || '';
        calledHeaders = (init?.headers as Record<string, string>) || {};
        calledBody = String(init?.body || '');

        return new Response(
          JSON.stringify({
            success: true,
            data: { id: 'tb_msg_98765' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const result = await sendSmsViaTextBee({
        recipient: '09171234567',
        message: 'Order #4001 ready',
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.messageId, 'tb_msg_98765');
      assert.strictEqual(result.recipient, '+639171234567');
      assert.strictEqual(result.gateway, 'TEXTBEE');

      assert.match(calledUrl, /\/gateway\/devices\/dev_123\/sendSMS/);
      assert.strictEqual(calledMethod, 'POST');
      assert.strictEqual(calledHeaders['x-api-key'], 'tb_test_key_xyz');

      const parsedBody = JSON.parse(calledBody);
      assert.deepStrictEqual(parsedBody.recipients, ['+639171234567']);
      assert.strictEqual(parsedBody.message, 'Order #4001 ready');
    });

    it('maps HTTP 401/403 to GATEWAY_AUTH_ERROR', async () => {
      process.env.TEXTBEE_MOCK_DISPATCH = 'false';
      process.env.TEXTBEE_API_KEY = 'invalid_key';

      globalThis.fetch = async () =>
        new Response(JSON.stringify({ message: 'Unauthorized device access' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });

      const result = await sendSmsViaTextBee({
        recipient: '09171234567',
        message: 'Test message',
      });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.gateway, 'TEXTBEE');
      assert.strictEqual(result.errorCode, 'GATEWAY_AUTH_ERROR');
    });

    it('maps HTTP 404 to DEVICE_NOT_FOUND', async () => {
      process.env.TEXTBEE_MOCK_DISPATCH = 'false';
      process.env.TEXTBEE_API_KEY = 'test_key';

      globalThis.fetch = async () =>
        new Response(JSON.stringify({ message: 'Device not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });

      const result = await sendSmsViaTextBee({
        recipient: '09171234567',
        message: 'Test message',
      });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.gateway, 'TEXTBEE');
      assert.strictEqual(result.errorCode, 'DEVICE_NOT_FOUND');
    });

    it('maps HTTP 503 / device offline message to DEVICE_OFFLINE', async () => {
      process.env.TEXTBEE_MOCK_DISPATCH = 'false';
      process.env.TEXTBEE_API_KEY = 'test_key';

      globalThis.fetch = async () =>
        new Response(JSON.stringify({ message: 'Device offline or unreachable' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });

      const result = await sendSmsViaTextBee({
        recipient: '09171234567',
        message: 'Test message',
      });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.gateway, 'TEXTBEE');
      assert.strictEqual(result.errorCode, 'DEVICE_OFFLINE');
    });

    it('maps HTTP 429 to GATEWAY_RATE_LIMITED', async () => {
      process.env.TEXTBEE_MOCK_DISPATCH = 'false';
      process.env.TEXTBEE_API_KEY = 'test_key';

      globalThis.fetch = async () =>
        new Response(JSON.stringify({ message: 'Rate limit exceeded' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        });

      const result = await sendSmsViaTextBee({
        recipient: '09171234567',
        message: 'Test message',
      });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.gateway, 'TEXTBEE');
      assert.strictEqual(result.errorCode, 'GATEWAY_RATE_LIMITED');
    });

    it('maps AbortSignal timeout to TIMEOUT', async () => {
      process.env.TEXTBEE_MOCK_DISPATCH = 'false';
      process.env.TEXTBEE_API_KEY = 'test_key';

      const controller = new AbortController();
      controller.abort();

      const result = await sendSmsViaTextBee({
        recipient: '09171234567',
        message: 'Test message',
        signal: controller.signal,
      });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.gateway, 'TEXTBEE');
      assert.strictEqual(result.errorCode, 'TIMEOUT');
    });

    it('maps network unreachable socket error to NETWORK_UNREACHABLE', async () => {
      process.env.TEXTBEE_MOCK_DISPATCH = 'false';
      process.env.TEXTBEE_API_KEY = 'test_key';

      globalThis.fetch = async () => {
        throw new Error('fetch failed: ECONNREFUSED');
      };

      const result = await sendSmsViaTextBee({
        recipient: '09171234567',
        message: 'Test message',
      });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.gateway, 'TEXTBEE');
      assert.strictEqual(result.errorCode, 'NETWORK_UNREACHABLE');
    });
  });

  describe('5. Security: Secret Isolation Verification', () => {
    it('verifies TEXTBEE secrets are never exposed on client NEXT_PUBLIC prefix', () => {
      assert.strictEqual(process.env.NEXT_PUBLIC_TEXTBEE_API_KEY, undefined);
      assert.strictEqual(process.env.NEXT_PUBLIC_TEXTBEE_DEVICE_ID, undefined);
    });
  });
});
