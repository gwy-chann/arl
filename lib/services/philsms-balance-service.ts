import {
  PHILSMS_DEFAULT_BASE_URL,
  PHILSMS_DEFAULT_SENDER_ID,
  philsmsBalanceResponseSchema,
  type PhilSmsAccountStatus,
  type GetPhilSmsBalanceOptions,
} from './philsms-contracts.ts';

interface CacheEntry {
  status: PhilSmsAccountStatus;
  cachedAtMs: number;
  expiresAtMs: number;
}

// In-memory server-side cache for PhilSMS balance status
let balanceCache: CacheEntry | null = null;

// Test override for deterministic testing
let testOverrideStatus: PhilSmsAccountStatus | null = null;

/**
 * Resets the in-memory PhilSMS balance cache. (Useful for tests)
 */
export function _resetPhilSmsBalanceCache(): void {
  balanceCache = null;
  testOverrideStatus = null;
}

/**
 * Sets a test override status for balance retrieval. (Useful for tests)
 */
export function _setTestPhilSmsBalanceOverride(status: PhilSmsAccountStatus | null): void {
  testOverrideStatus = status;
}

/**
 * Evaluates the credit threshold according to business rules:
 * - < 10 credits -> 'critical'
 * - < 50 credits -> 'warning'
 * - >= 50 credits -> 'healthy'
 */
export function evaluateCreditThreshold(balance: number): 'healthy' | 'warning' | 'critical' {
  if (balance < 10) {
    return 'critical';
  }
  if (balance < 50) {
    return 'warning';
  }
  return 'healthy';
}

/**
 * Formats estimated Philippine Peso (PHP) value from credit units.
 * Benchmark: 1 credit ~= ₱0.50
 */
export function formatEstimatedPesoValue(credits: number, isMock = false): string {
  if (isMock) {
    return 'Unlimited (Local Mock)';
  }
  const peso = credits * 0.5;
  return `~PHP ${peso.toFixed(2)}`;
}

/**
 * Fetches, normalizes, and caches the PhilSMS prepaid account credit balance.
 *
 * Implements:
 * - Offline Mock Mode (when PHILSMS_MOCK_DISPATCH="true" or PHILSMS_API_TOKEN is unset)
 * - 15-minute standard cache TTL (900 seconds)
 * - 5-minute critical cache TTL (300 seconds) when credits < 10
 * - On-demand cache invalidation via forceRefresh: true
 * - Graceful degradation on network timeout or gateway failure
 */
export async function getPhilSmsBalance(
  options?: GetPhilSmsBalanceOptions
): Promise<PhilSmsAccountStatus> {
  if (testOverrideStatus) {
    return { ...testOverrideStatus };
  }

  const apiToken = process.env.PHILSMS_API_TOKEN?.trim();
  const isMock = process.env.PHILSMS_MOCK_DISPATCH === 'true' || !apiToken;
  const configuredSenderId = (
    process.env.PHILSMS_SENDER_ID || PHILSMS_DEFAULT_SENDER_ID
  ).trim();

  // 1. Offline mock mode handling
  if (isMock) {
    return {
      success: true,
      balance: 9999,
      currency: 'PHP',
      senderId: configuredSenderId,
      isMock: true,
      cached: false,
      warningLevel: 'mock',
      statusText: 'Mock Gateway Mode (Offline Development)',
    };
  }

  const now = Date.now();

  // 2. Check in-memory cache if forceRefresh is not requested
  if (!options?.forceRefresh && balanceCache && now < balanceCache.expiresAtMs) {
    return {
      ...balanceCache.status,
      cached: true,
    };
  }

  // 3. Live gateway request
  const baseUrl = (process.env.PHILSMS_BASE_URL || PHILSMS_DEFAULT_BASE_URL).replace(/\/+$/, '');
  const url = `${baseUrl}/balance`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 3a. Handle authentication failure (HTTP 401)
    if (response.status === 401) {
      balanceCache = null;
      return {
        success: false,
        balance: 0,
        currency: 'PHP',
        senderId: configuredSenderId,
        isMock: false,
        cached: false,
        warningLevel: 'error',
        statusText: 'Gateway Authentication Failed',
        errorMessage: 'Unauthorized: Check PHILSMS_API_TOKEN in environment',
      };
    }

    // 3b. Handle non-200 responses
    if (!response.ok) {
      // Fallback to cached data if available
      if (balanceCache) {
        return {
          ...balanceCache.status,
          cached: true,
          statusText: `Gateway Unreachable (${response.status}) - Showing Stale Cache`,
        };
      }

      return {
        success: false,
        balance: 0,
        currency: 'PHP',
        senderId: configuredSenderId,
        isMock: false,
        cached: false,
        warningLevel: 'error',
        statusText: `Gateway Error (${response.status})`,
        errorMessage: `PhilSMS gateway returned HTTP ${response.status}`,
      };
    }

    // 3c. Parse and normalize successful response
    const rawData = await response.json();
    const parsed = philsmsBalanceResponseSchema.safeParse(rawData);

    let rawBalance = 0;
    let senderId = configuredSenderId;
    let currency = 'PHP';

    if (parsed.success && parsed.data.data) {
      const { balance, currency: cur, sender_id: sid } = parsed.data.data;
      rawBalance = typeof balance === 'number' ? balance : parseFloat(String(balance)) || 0;
      if (cur) currency = cur;
      if (sid) senderId = sid;
    } else if (rawData && typeof rawData === 'object' && 'data' in rawData) {
      const dataObj = (rawData as Record<string, unknown>).data as Record<string, unknown>;
      if (dataObj && 'balance' in dataObj) {
        rawBalance = parseFloat(String(dataObj.balance)) || 0;
      }
      if (dataObj && 'sender_id' in dataObj && typeof dataObj.sender_id === 'string') {
        senderId = dataObj.sender_id;
      }
      if (dataObj && 'currency' in dataObj && typeof dataObj.currency === 'string') {
        currency = dataObj.currency;
      }
    }

    const warningLevel = evaluateCreditThreshold(rawBalance);

    let statusText = 'Connected (PhilSMS Gateway)';
    if (warningLevel === 'warning') {
      statusText = 'Low Balance Warning';
    } else if (warningLevel === 'critical') {
      statusText = 'Critical Balance Alert';
    }

    // Dynamic TTL: 5 minutes if critical (<10), otherwise 15 minutes
    const ttlMs = warningLevel === 'critical' ? 5 * 60 * 1000 : 15 * 60 * 1000;
    const cachedAtIso = new Date(now).toISOString();
    const expiresAtIso = new Date(now + ttlMs).toISOString();

    const statusResult: PhilSmsAccountStatus = {
      success: true,
      balance: rawBalance,
      currency,
      senderId,
      isMock: false,
      cached: false,
      cachedAt: cachedAtIso,
      expiresAt: expiresAtIso,
      warningLevel,
      statusText,
    };

    // Store in cache
    balanceCache = {
      status: statusResult,
      cachedAtMs: now,
      expiresAtMs: now + ttlMs,
    };

    return statusResult;
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    // Fallback to cached data if network throws
    if (balanceCache) {
      return {
        ...balanceCache.status,
        cached: true,
        statusText: 'Gateway Unreachable - Showing Cached Balance',
      };
    }

    const errMessage = err instanceof Error ? err.message : 'Unknown gateway communication error';

    return {
      success: false,
      balance: 0,
      currency: 'PHP',
      senderId: configuredSenderId,
      isMock: false,
      cached: false,
      warningLevel: 'error',
      statusText: 'Gateway Unreachable',
      errorMessage: errMessage,
    };
  }
}
