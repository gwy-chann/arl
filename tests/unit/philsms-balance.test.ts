import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateCreditThreshold,
  formatEstimatedPesoValue,
  getPhilSmsBalance,
  _resetPhilSmsBalanceCache,
} from '../../lib/services/philsms-balance-service.ts';

describe('Feature ARL-27: PhilSMS Credit Balance Monitor & Health Diagnostic', () => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
    _resetPhilSmsBalanceCache();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    globalThis.fetch = originalFetch;
    _resetPhilSmsBalanceCache();
  });

  describe('1. Threshold Evaluation Logic', () => {
    it('categorizes credit balance >= 50 as healthy', () => {
      assert.strictEqual(evaluateCreditThreshold(482), 'healthy');
      assert.strictEqual(evaluateCreditThreshold(100), 'healthy');
      assert.strictEqual(evaluateCreditThreshold(50), 'healthy');
    });

    it('categorizes credit balance between 10 and 49 as warning', () => {
      assert.strictEqual(evaluateCreditThreshold(49), 'warning');
      assert.strictEqual(evaluateCreditThreshold(25), 'warning');
      assert.strictEqual(evaluateCreditThreshold(10), 'warning');
    });

    it('categorizes credit balance < 10 as critical', () => {
      assert.strictEqual(evaluateCreditThreshold(9), 'critical');
      assert.strictEqual(evaluateCreditThreshold(5), 'critical');
      assert.strictEqual(evaluateCreditThreshold(0), 'critical');
    });
  });

  describe('2. Estimated Peso Value Formatting', () => {
    it('correctly calculates and formats estimated PHP value at ₱0.50 per credit', () => {
      assert.strictEqual(formatEstimatedPesoValue(482), '~PHP 241.00');
      assert.strictEqual(formatEstimatedPesoValue(49), '~PHP 24.50');
      assert.strictEqual(formatEstimatedPesoValue(10), '~PHP 5.00');
      assert.strictEqual(formatEstimatedPesoValue(0), '~PHP 0.00');
    });

    it('returns "Unlimited (Local Mock)" for mock mode', () => {
      assert.strictEqual(formatEstimatedPesoValue(9999, true), 'Unlimited (Local Mock)');
    });
  });

  describe('3. Offline Mock Mode Fallback', () => {
    it('returns mock status when PHILSMS_API_TOKEN is unset', async () => {
      delete process.env.PHILSMS_API_TOKEN;
      delete process.env.PHILSMS_MOCK_DISPATCH;

      const result = await getPhilSmsBalance();

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.isMock, true);
      assert.strictEqual(result.warningLevel, 'mock');
      assert.strictEqual(result.statusText, 'Mock Gateway Mode (Offline Development)');
      assert.strictEqual(result.cached, false);
    });

    it('returns mock status when PHILSMS_MOCK_DISPATCH is true even if token is present', async () => {
      process.env.PHILSMS_API_TOKEN = 'live_secret_token_abc';
      process.env.PHILSMS_MOCK_DISPATCH = 'true';

      const result = await getPhilSmsBalance();

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.isMock, true);
      assert.strictEqual(result.warningLevel, 'mock');
    });
  });

  describe('4. Live Gateway Fetch, Thresholds & Caching Lifecycle', () => {
    it('fetches live balance and returns healthy status (Scenario 1)', async () => {
      process.env.PHILSMS_API_TOKEN = 'valid_token_123';
      process.env.PHILSMS_MOCK_DISPATCH = 'false';

      let fetchCallCount = 0;
      globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
        fetchCallCount++;
        assert.ok(String(url).endsWith('/balance'));
        const headers = init?.headers as Record<string, string>;
        assert.strictEqual(headers.Authorization, 'Bearer valid_token_123');

        return new Response(
          JSON.stringify({
            status: 'success',
            data: {
              balance: '482.00',
              currency: 'PHP',
              sender_id: 'ARL',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }) as unknown as typeof fetch;

      const result1 = await getPhilSmsBalance();

      assert.strictEqual(result1.success, true);
      assert.strictEqual(result1.balance, 482);
      assert.strictEqual(result1.currency, 'PHP');
      assert.strictEqual(result1.senderId, 'ARL');
      assert.strictEqual(result1.warningLevel, 'healthy');
      assert.strictEqual(result1.cached, false);
      assert.strictEqual(fetchCallCount, 1);

      // Subsequent call should hit cache without issuing another network request
      const result2 = await getPhilSmsBalance();
      assert.strictEqual(result2.success, true);
      assert.strictEqual(result2.balance, 482);
      assert.strictEqual(result2.cached, true);
      assert.strictEqual(fetchCallCount, 1); // No new network call
    });

    it('triggers warning threshold alert at 49 credits (Scenario 2)', async () => {
      process.env.PHILSMS_API_TOKEN = 'valid_token_123';
      process.env.PHILSMS_MOCK_DISPATCH = 'false';

      globalThis.fetch = (async () => {
        return new Response(
          JSON.stringify({
            status: 'success',
            data: {
              balance: '49.00',
              currency: 'PHP',
              sender_id: 'ARL',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }) as unknown as typeof fetch;

      const result = await getPhilSmsBalance();

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.balance, 49);
      assert.strictEqual(result.warningLevel, 'warning');
      assert.strictEqual(result.statusText, 'Low Balance Warning');
    });

    it('triggers critical alert at 5 credits with reduced 5-minute TTL (Scenario 3)', async () => {
      process.env.PHILSMS_API_TOKEN = 'valid_token_123';
      process.env.PHILSMS_MOCK_DISPATCH = 'false';

      globalThis.fetch = (async () => {
        return new Response(
          JSON.stringify({
            status: 'success',
            data: {
              balance: 5,
              currency: 'PHP',
              sender_id: 'ARL',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }) as unknown as typeof fetch;

      const result = await getPhilSmsBalance();

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.balance, 5);
      assert.strictEqual(result.warningLevel, 'critical');
      assert.strictEqual(result.statusText, 'Critical Balance Alert');

      // Verify expiration timestamp is approximately 5 minutes in future (not 15m)
      const cachedAt = new Date(result.cachedAt!).getTime();
      const expiresAt = new Date(result.expiresAt!).getTime();
      const diffMs = expiresAt - cachedAt;
      assert.ok(diffMs >= 299000 && diffMs <= 301000, `Expected ~300000ms TTL, got ${diffMs}ms`);
    });

    it('forceRefresh: true bypasses cache and issues fresh request (Scenario 5)', async () => {
      process.env.PHILSMS_API_TOKEN = 'valid_token_123';
      process.env.PHILSMS_MOCK_DISPATCH = 'false';

      let currentBalance = '50.00';
      let fetchCallCount = 0;

      globalThis.fetch = (async () => {
        fetchCallCount++;
        return new Response(
          JSON.stringify({
            status: 'success',
            data: {
              balance: currentBalance,
              currency: 'PHP',
              sender_id: 'ARL',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }) as unknown as typeof fetch;

      // Initial call
      const res1 = await getPhilSmsBalance();
      assert.strictEqual(res1.balance, 50);
      assert.strictEqual(fetchCallCount, 1);

      // Update mock response
      currentBalance = '550.00';

      // Call without forceRefresh -> should return cached 50
      const res2 = await getPhilSmsBalance();
      assert.strictEqual(res2.balance, 50);
      assert.strictEqual(res2.cached, true);
      assert.strictEqual(fetchCallCount, 1);

      // Call with forceRefresh: true -> should bust cache and return 550
      const res3 = await getPhilSmsBalance({ forceRefresh: true });
      assert.strictEqual(res3.balance, 550);
      assert.strictEqual(res3.cached, false);
      assert.strictEqual(fetchCallCount, 2);
    });
  });

  describe('5. Error Handling & Gateway Diagnostics', () => {
    it('handles HTTP 401 Unauthorized gracefully without throwing', async () => {
      process.env.PHILSMS_API_TOKEN = 'invalid_expired_token';
      process.env.PHILSMS_MOCK_DISPATCH = 'false';

      globalThis.fetch = (async () => {
        return new Response(JSON.stringify({ message: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }) as unknown as typeof fetch;

      const result = await getPhilSmsBalance();

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.warningLevel, 'error');
      assert.strictEqual(result.statusText, 'Gateway Authentication Failed');
      assert.ok(result.errorMessage?.includes('PHILSMS_API_TOKEN'));
    });

    it('falls back to cached data when subsequent request fails', async () => {
      process.env.PHILSMS_API_TOKEN = 'valid_token_123';
      process.env.PHILSMS_MOCK_DISPATCH = 'false';

      // 1. Initial successful response
      globalThis.fetch = (async () => {
        return new Response(
          JSON.stringify({
            status: 'success',
            data: {
              balance: '150.00',
              currency: 'PHP',
              sender_id: 'ARL',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }) as unknown as typeof fetch;

      const res1 = await getPhilSmsBalance();
      assert.strictEqual(res1.balance, 150);

      // 2. Gateway goes down with 503 Service Unavailable, forceRefresh requested
      globalThis.fetch = (async () => {
        return new Response('Service Unavailable', { status: 503 });
      }) as unknown as typeof fetch;

      const res2 = await getPhilSmsBalance({ forceRefresh: true });
      assert.strictEqual(res2.success, true);
      assert.strictEqual(res2.balance, 150);
      assert.strictEqual(res2.cached, true);
      assert.ok(res2.statusText.includes('Showing Stale Cache') || res2.statusText.includes('Cached'));
    });

    it('handles unexpected network failure without prior cache gracefully', async () => {
      process.env.PHILSMS_API_TOKEN = 'valid_token_123';
      process.env.PHILSMS_MOCK_DISPATCH = 'false';

      globalThis.fetch = (async () => {
        throw new Error('ECONNREFUSED');
      }) as unknown as typeof fetch;

      const result = await getPhilSmsBalance();

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.warningLevel, 'error');
      assert.strictEqual(result.statusText, 'Gateway Unreachable');
      assert.strictEqual(result.errorMessage, 'ECONNREFUSED');
    });
  });
});
