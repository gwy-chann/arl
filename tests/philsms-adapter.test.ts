import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePhilippineMobileForPhilSms,
  normalizeAndSanitizeGsm7,
  calculateSmsSegments,
  sendSmsViaPhilSms,
  _getPhilSmsMockHistory,
  _resetPhilSmsMockHistory,
} from '../lib/services/philsms-adapter.ts';
import {
  philsmsSendRequestSchema,
  philsmsSendResponseSchema,
  philsmsCanonicalMobileSchema,
} from '../lib/services/philsms-contracts.ts';

describe('Feature ARL-24: PhilSMS Gateway Adapter & GSM-7 Payload Encoder', () => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    _resetPhilSmsMockHistory();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    globalThis.fetch = originalFetch;
  });

  describe('Philippine Mobile Number Canonicalization Matrix', () => {
    it('canonicalizes standard national 11-digit format starting with 09', () => {
      const canonical = normalizePhilippineMobileForPhilSms('09171234567');
      assert.equal(canonical, '639171234567');
    });

    it('canonicalizes international E.164 format starting with +639', () => {
      const canonical = normalizePhilippineMobileForPhilSms('+639171234567');
      assert.equal(canonical, '639171234567');
    });

    it('canonicalizes numbers that already have 639 international prefix without plus', () => {
      const canonical = normalizePhilippineMobileForPhilSms('639171234567');
      assert.equal(canonical, '639171234567');
    });

    it('strips whitespace, parentheses, and dashes', () => {
      assert.equal(normalizePhilippineMobileForPhilSms('0917 123 4567'), '639171234567');
      assert.equal(normalizePhilippineMobileForPhilSms('(0917) 123-4567'), '639171234567');
      assert.equal(normalizePhilippineMobileForPhilSms('+63-917-123-4567'), '639171234567');
      assert.equal(normalizePhilippineMobileForPhilSms('+63 (917) 123.4567'), '639171234567');
    });

    it('rejects numbers with fewer than 11 digits', () => {
      assert.throws(() => normalizePhilippineMobileForPhilSms('0912345'), {
        message: 'Invalid Philippine mobile number format',
      });
      assert.throws(() => normalizePhilippineMobileForPhilSms('12345'), {
        message: 'Invalid Philippine mobile number format',
      });
    });

    it('rejects numbers not starting with valid Philippine mobile prefixes (e.g. 08...)', () => {
      assert.throws(() => normalizePhilippineMobileForPhilSms('08171234567'), {
        message: 'Invalid Philippine mobile number format',
      });
      assert.throws(() => normalizePhilippineMobileForPhilSms('+12025550199'), {
        message: 'Invalid Philippine mobile number format',
      });
    });

    it('rejects null, undefined, or empty phone inputs', () => {
      assert.throws(() => normalizePhilippineMobileForPhilSms(''), {
        message: 'Invalid Philippine mobile number format',
      });
      // @ts-expect-error Testing runtime invalid input
      assert.throws(() => normalizePhilippineMobileForPhilSms(null), {
        message: 'Invalid Philippine mobile number format',
      });
    });
  });

  describe('GSM-7 Normalization & Character Optimization Engine', () => {
    it('replaces Philippine Peso currency symbol ₱ with ASCII "PHP "', () => {
      const input = 'Total utang: ₱1,500.00 for Receipt #0012';
      const output = normalizeAndSanitizeGsm7(input);
      assert.equal(output, 'Total utang: PHP 1,500.00 for Receipt #0012');
      assert.equal(output.includes('₱'), false);
    });

    it('converts typographic smart double quotes to standard ASCII quotes', () => {
      const input = '“ARLQ Condiments” Order Confirmation';
      const output = normalizeAndSanitizeGsm7(input);
      assert.equal(output, '"ARLQ Condiments" Order Confirmation');
    });

    it('converts typographic smart single quotes and apostrophes to standard ASCII', () => {
      const input = 'Juan’s order ‘special’';
      const output = normalizeAndSanitizeGsm7(input);
      assert.equal(output, "Juan's order 'special'");
    });

    it('converts en-dash and em-dash to standard ASCII hyphen', () => {
      const input = 'Balance overdue — please settle – thank you';
      const output = normalizeAndSanitizeGsm7(input);
      assert.equal(output, 'Balance overdue - please settle - thank you');
    });

    it('trims extraneous leading and trailing whitespace', () => {
      const input = '   ARLQ Alert: Settle balance.   ';
      const output = normalizeAndSanitizeGsm7(input);
      assert.equal(output, 'ARLQ Alert: Settle balance.');
    });

    it('handles empty or non-string inputs gracefully', () => {
      assert.equal(normalizeAndSanitizeGsm7(''), '');
      // @ts-expect-error Testing runtime non-string input
      assert.equal(normalizeAndSanitizeGsm7(null), '');
    });
  });

  describe('Diagnostic Segment & Credit Calculation Engine', () => {
    it('handles empty message with zero segments and credits', () => {
      const res = calculateSmsSegments('');
      assert.equal(res.encoding, 'GSM-7');
      assert.equal(res.characterCount, 0);
      assert.equal(res.segmentCount, 0);
      assert.equal(res.estimatedCredits, 0);
      assert.equal(res.hasNonGsmCharacters, false);
    });

    it('classifies standard ASCII and GSM-7 characters as GSM-7 with 1 credit up to 160 chars', () => {
      const text = 'ARLQ Alert: Juan dela Cruz owes PHP 1,250.00 for receipt 00104. Unpaid for 8 days. Reminders stop once marked Paid.';
      assert.ok(text.length <= 160);
      const res = calculateSmsSegments(text);
      assert.equal(res.encoding, 'GSM-7');
      assert.equal(res.characterCount, text.length);
      assert.equal(res.segmentCount, 1);
      assert.equal(res.estimatedCredits, 1);
      assert.equal(res.hasNonGsmCharacters, false);
    });

    it('calculates concatenated segments for GSM-7 text exceeding 160 characters (153 chars/segment)', () => {
      const text160 = 'A'.repeat(160);
      const res160 = calculateSmsSegments(text160);
      assert.equal(res160.segmentCount, 1);
      assert.equal(res160.estimatedCredits, 1);

      const text161 = 'A'.repeat(161);
      const res161 = calculateSmsSegments(text161);
      assert.equal(res161.segmentCount, 2);
      assert.equal(res161.estimatedCredits, 2);

      const text306 = 'A'.repeat(306);
      const res306 = calculateSmsSegments(text306);
      assert.equal(res306.segmentCount, 2);

      const text307 = 'A'.repeat(307);
      const res307 = calculateSmsSegments(text307);
      assert.equal(res307.segmentCount, 3);
      assert.equal(res307.estimatedCredits, 3);
    });

    it('detects un-sanitized Unicode characters and falls back to UCS-2 with 70-char segment limit', () => {
      // Contains un-normalized ₱ symbol
      const textWithPeso = 'ARLQ Alert: Settle ₱450.00';
      const res = calculateSmsSegments(textWithPeso);
      assert.equal(res.encoding, 'UCS-2');
      assert.equal(res.hasNonGsmCharacters, true);
      assert.deepEqual(res.nonGsmCharacters, ['₱']);
      assert.equal(res.segmentCount, 1);

      // UCS-2 concatenated beyond 70 chars (67 chars/segment)
      const ucs2Long = '₱' + 'A'.repeat(71);
      const resLong = calculateSmsSegments(ucs2Long);
      assert.equal(resLong.encoding, 'UCS-2');
      assert.equal(resLong.segmentCount, 2);
      assert.equal(resLong.estimatedCredits, 2);
    });

    it('counts GSM-7 extension characters (e.g. € or brackets) as 2 septets', () => {
      const textWithEuro = 'Price: 10€';
      const res = calculateSmsSegments(textWithEuro);
      assert.equal(res.encoding, 'GSM-7');
      assert.equal(res.characterCount, textWithEuro.length + 1); // € counts as 2
    });
  });

  describe('Offline Mock Mode Dispatch', () => {
    it('dispatches via in-memory mock when PHILSMS_MOCK_DISPATCH is "true"', async () => {
      process.env.PHILSMS_MOCK_DISPATCH = 'true';
      process.env.PHILSMS_API_TOKEN = 'test_token';

      let fetchCalled = false;
      globalThis.fetch = async () => {
        fetchCalled = true;
        throw new Error('Should not call fetch in mock mode');
      };

      const result = await sendSmsViaPhilSms({
        recipient: '09181234567',
        message: 'ARLQ Alert: Settle ₱500 balance',
      });

      assert.equal(fetchCalled, false);
      assert.equal(result.success, true);
      assert.equal(result.recipient, '639181234567');
      assert.ok(result.messageId?.startsWith('mock_philsms_'));
      assert.equal(result.encoding, 'GSM-7'); // ₱ normalized to PHP
      assert.equal(result.cost, 1);

      const history = _getPhilSmsMockHistory();
      assert.equal(history.length, 1);
      assert.equal(history[0].recipient, '639181234567');
      assert.equal(history[0].message, 'ARLQ Alert: Settle PHP 500 balance');
    });

    it('defaults to mock dispatch when PHILSMS_API_TOKEN is unset or empty', async () => {
      delete process.env.PHILSMS_API_TOKEN;
      delete process.env.PHILSMS_MOCK_DISPATCH;

      const result = await sendSmsViaPhilSms({
        recipient: '09171234567',
        message: 'Test offline notification',
      });

      assert.equal(result.success, true);
      assert.ok(result.messageId?.startsWith('mock_philsms_'));
      assert.equal(_getPhilSmsMockHistory().length, 1);
    });
  });

  describe('Validation & Premature Failure Isolation', () => {
    it('rejects invalid recipient format before attempting any network or mock dispatch', async () => {
      process.env.PHILSMS_MOCK_DISPATCH = 'true';

      const result = await sendSmsViaPhilSms({
        recipient: '091234',
        message: 'This should fail early',
      });

      assert.equal(result.success, false);
      assert.equal(result.errorCode, 'INVALID_RECIPIENT_MOBILE');
      assert.equal(result.errorMessage, 'Invalid Philippine mobile number format');
      assert.equal(_getPhilSmsMockHistory().length, 0);
    });
  });

  describe('Live Gateway Dispatch (HTTP Mocking)', () => {
    beforeEach(() => {
      process.env.PHILSMS_MOCK_DISPATCH = 'false';
      process.env.PHILSMS_API_TOKEN = 'valid_secret_bearer_token';
      process.env.PHILSMS_API_BASE_URL = 'https://app.philsms.com/api/v3';
      process.env.PHILSMS_SENDER_ID = 'PhilSMS';
    });

    it('issues an HTTPS POST with correct Bearer auth, headers, and request body', async () => {
      let capturedUrl = '';
      let capturedHeaders: Record<string, string> = {};
      let capturedBody: unknown = null;

      globalThis.fetch = async (url, init) => {
        capturedUrl = url.toString();
        capturedHeaders = init?.headers as Record<string, string>;
        capturedBody = JSON.parse(init?.body as string);

        return new Response(
          JSON.stringify({
            status: 'success',
            message: 'Message sent successfully',
            data: {
              uid: '648a123f4b5c6',
              to: '639171234567',
              message: 'ARLQ Alert: Settle PHP 450 balance',
              cost: 1,
              status: 'sent',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const result = await sendSmsViaPhilSms({
        recipient: '09171234567',
        message: 'ARLQ Alert: Settle ₱450 balance',
      });

      assert.equal(capturedUrl, 'https://app.philsms.com/api/v3/sms/send');
      assert.equal(capturedHeaders['Authorization'], 'Bearer valid_secret_bearer_token');
      assert.equal(capturedHeaders['Content-Type'], 'application/json');
      assert.equal(capturedHeaders['Accept'], 'application/json');

      assert.deepEqual(capturedBody, {
        recipient: '639171234567',
        sender_id: 'PhilSMS',
        type: 'plain',
        message: 'ARLQ Alert: Settle PHP 450 balance',
      });

      assert.equal(result.success, true);
      assert.equal(result.messageId, '648a123f4b5c6');
      assert.equal(result.recipient, '639171234567');
      assert.equal(result.senderId, 'PhilSMS');
      assert.equal(result.cost, 1);
      assert.equal(result.encoding, 'GSM-7');
    });

    it('handles HTTP 400 Bad Request', async () => {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({
            status: 'error',
            message: 'Unsupported sender_id',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const result = await sendSmsViaPhilSms({
        recipient: '09171234567',
        message: 'Test message',
      });

      assert.equal(result.success, false);
      assert.equal(result.errorCode, 'GATEWAY_BAD_REQUEST');
      assert.equal(result.errorMessage, 'Unsupported sender_id');
    });

    it('handles HTTP 401 Unauthorized (Auth failure)', async () => {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({
            status: 'error',
            message: 'Unauthenticated or token expired',
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const result = await sendSmsViaPhilSms({
        recipient: '09171234567',
        message: 'Test message',
      });

      assert.equal(result.success, false);
      assert.equal(result.errorCode, 'GATEWAY_AUTH_ERROR');
      assert.equal(result.errorMessage, 'Unauthenticated or token expired');
    });

    it('handles HTTP 402 Payment Required (Insufficient Credits)', async () => {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({
            status: 'error',
            message: 'Insufficient credit balance',
          }),
          { status: 402, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const result = await sendSmsViaPhilSms({
        recipient: '09171234567',
        message: 'Test message',
      });

      assert.equal(result.success, false);
      assert.equal(result.errorCode, 'INSUFFICIENT_CREDITS');
      assert.equal(result.errorMessage, 'Insufficient credit balance');
    });

    it('handles HTTP 422 Unprocessable Entity', async () => {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({
            status: 'error',
            message: 'Recipient mobile is blacklisted by telco',
          }),
          { status: 422, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const result = await sendSmsViaPhilSms({
        recipient: '09171234567',
        message: 'Test message',
      });

      assert.equal(result.success, false);
      assert.equal(result.errorCode, 'INVALID_RECIPIENT_MOBILE');
      assert.equal(result.errorMessage, 'Recipient mobile is blacklisted by telco');
    });

    it('handles HTTP 429 Too Many Requests (Rate limit)', async () => {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({
            status: 'error',
            message: 'Rate limit exceeded',
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const result = await sendSmsViaPhilSms({
        recipient: '09171234567',
        message: 'Test message',
      });

      assert.equal(result.success, false);
      assert.equal(result.errorCode, 'GATEWAY_RATE_LIMITED');
      assert.equal(result.errorMessage, 'Rate limit exceeded');
    });

    it('catches DNS or network failures and returns NETWORK_UNREACHABLE', async () => {
      globalThis.fetch = async () => {
        throw new Error('getaddrinfo ENOTFOUND app.philsms.com');
      };

      const result = await sendSmsViaPhilSms({
        recipient: '09171234567',
        message: 'Test message',
      });

      assert.equal(result.success, false);
      assert.equal(result.errorCode, 'NETWORK_UNREACHABLE');
      assert.ok(result.errorMessage?.includes('ENOTFOUND'));
    });
  });

  describe('Zod Contracts & Schema Integrity', () => {
    it('validates canonical PhilSMS mobile numbers', () => {
      assert.equal(philsmsCanonicalMobileSchema.safeParse('639171234567').success, true);
      assert.equal(philsmsCanonicalMobileSchema.safeParse('09171234567').success, false);
      assert.equal(philsmsCanonicalMobileSchema.safeParse('6391712345').success, false);
    });

    it('validates PhilSMS send request schema', () => {
      const valid = philsmsSendRequestSchema.safeParse({
        recipient: '639171234567',
        sender_id: 'PhilSMS',
        type: 'plain',
        message: 'Hello world',
      });
      assert.equal(valid.success, true);

      const emptyMsg = philsmsSendRequestSchema.safeParse({
        recipient: '639171234567',
        message: '',
      });
      assert.equal(emptyMsg.success, false);
    });

    it('validates PhilSMS send response schema', () => {
      const validSuccess = philsmsSendResponseSchema.safeParse({
        status: 'success',
        message: 'Message sent successfully',
        data: {
          uid: 'uid-1234',
          to: '639171234567',
          message: 'Hello',
        },
      });
      assert.equal(validSuccess.success, true);

      const validError = philsmsSendResponseSchema.safeParse({
        status: 'error',
        message: 'Insufficient credit balance',
      });
      assert.equal(validError.success, true);
    });
  });
});
