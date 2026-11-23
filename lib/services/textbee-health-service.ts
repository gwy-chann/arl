import {
  TEXTBEE_DEFAULT_BASE_URL,
  TEXTBEE_DEFAULT_DEVICE_NAME,
  type TextBeeDeviceHealth,
  type TextBeeHealthLevel,
  type TextBeeNetworkType,
  type GetTextBeeHealthOptions,
  type TextBeeRawDeviceApiResponse,
} from './textbee-contracts.ts';

interface CacheEntry {
  health: TextBeeDeviceHealth;
  cachedAtMs: number;
  expiresAtMs: number;
}

// In-memory server-side cache for TextBee device health
let healthCache: CacheEntry | null = null;

// Test override for deterministic unit testing
let testOverrideHealth: TextBeeDeviceHealth | null = null;

/**
 * Resets the in-memory TextBee device health cache (for tests).
 */
export function _resetTextBeeHealthCache(): void {
  healthCache = null;
  testOverrideHealth = null;
}

/**
 * Sets a test override status for TextBee health retrieval (for tests).
 */
export function _setTestTextBeeHealthOverride(health: TextBeeDeviceHealth | null): void {
  testOverrideHealth = health;
}

/**
 * Evaluates health level and status text based on device connectivity,
 * battery percentage, charging status, and heartbeat ping freshness.
 *
 * Rules:
 * - If not online -> 'critical' ("Device Offline")
 * - If not charging and battery < 10% -> 'critical' ("Critical Battery Alert (<10%)")
 * - If lastSeen is older than 30 minutes -> 'critical' ("Heartbeat Stale (>30m)")
 * - If not charging and battery < 20% -> 'warning' ("Low Battery Warning (<20%)")
 * - If lastSeen is older than 15 minutes -> 'warning' ("Heartbeat Delayed (>15m)")
 * - Otherwise -> 'healthy' ("Connected (TextBee Gateway)")
 */
export function evaluateDeviceHealthLevel(params: {
  isOnline: boolean;
  batteryPercentage: number;
  isCharging: boolean;
  lastSeenAt?: string | null;
  nowMs?: number;
}): { level: TextBeeHealthLevel; statusText: string } {
  if (!params.isOnline) {
    return {
      level: 'critical',
      statusText: 'Device Offline',
    };
  }

  const now = params.nowMs ?? Date.now();
  let heartbeatAgeMs = 0;
  if (params.lastSeenAt) {
    const parsedTime = new Date(params.lastSeenAt).getTime();
    if (!Number.isNaN(parsedTime)) {
      heartbeatAgeMs = Math.max(0, now - parsedTime);
    }
  }

  // Heartbeat older than 30 minutes (1,800,000 ms) is critical
  if (heartbeatAgeMs > 30 * 60 * 1000) {
    return {
      level: 'critical',
      statusText: 'Device Offline (Heartbeat > 30m)',
    };
  }

  // Critical battery (< 10%) when not charging
  if (!params.isCharging && params.batteryPercentage < 10) {
    return {
      level: 'critical',
      statusText: 'Critical Battery Alert (<10%)',
    };
  }

  // Warning battery (< 20%) when not charging
  if (!params.isCharging && params.batteryPercentage < 20) {
    return {
      level: 'warning',
      statusText: 'Low Battery Warning (<20%)',
    };
  }

  // Heartbeat delayed between 15m and 30m
  if (heartbeatAgeMs > 15 * 60 * 1000) {
    return {
      level: 'warning',
      statusText: 'Heartbeat Delayed (>15m)',
    };
  }

  return {
    level: 'healthy',
    statusText: 'Connected (TextBee Gateway)',
  };
}

/**
 * Formats user-facing battery label with percentage and charging state.
 */
export function formatBatteryLabel(percentage: number, isCharging: boolean, isMock = false): string {
  if (isMock) {
    return `${percentage}% (Local Mock)`;
  }
  return isCharging ? `${percentage}% (Charging)` : `${percentage}%`;
}

/**
 * Normalizes raw network type string from gateway API.
 */
export function normalizeNetworkType(rawType?: string | null): TextBeeNetworkType {
  if (!rawType) return 'UNKNOWN';
  const upper = rawType.trim().toUpperCase();
  if (upper.includes('WIFI') || upper.includes('WI-FI')) return 'WIFI';
  if (upper.includes('CELL') || upper.includes('LTE') || upper.includes('5G') || upper.includes('MOBILE')) {
    return 'CELLULAR';
  }
  if (upper.includes('ETHERNET')) return 'ETHERNET';
  if (upper.includes('NONE') || upper === 'OFFLINE') return 'NONE';
  return 'UNKNOWN';
}

/**
 * Fetches, evaluates, and caches the TextBee Android SMS gateway device health.
 *
 * Implements:
 * - Offline mock mode when TEXTBEE_MOCK_HEALTH="true", TEXTBEE_MOCK_DISPATCH="true", or TEXTBEE_API_KEY is unset
 * - 15-minute standard cache TTL (900 seconds)
 * - 5-minute degraded/critical cache TTL (300 seconds)
 * - On-demand cache invalidation via forceRefresh: true
 * - Graceful fallback to stale cache on network failure
 */
export async function getTextBeeDeviceHealth(
  options?: GetTextBeeHealthOptions
): Promise<TextBeeDeviceHealth> {
  if (testOverrideHealth) {
    return { ...testOverrideHealth };
  }

  const apiKey = process.env.TEXTBEE_API_KEY?.trim();
  const configuredDeviceId = (
    process.env.TEXTBEE_DEVICE_ID || 'device_arlq_primary'
  ).trim();
  const configuredDeviceName = (
    process.env.TEXTBEE_DEVICE_NAME || TEXTBEE_DEFAULT_DEVICE_NAME
  ).trim();

  const isMock =
    process.env.TEXTBEE_MOCK_HEALTH === 'true' ||
    process.env.TEXTBEE_MOCK_DISPATCH === 'true' ||
    !apiKey;

  // 1. Offline mock mode handling
  if (isMock) {
    const nowIso = new Date().toISOString();
    return {
      success: true,
      deviceId: configuredDeviceId,
      deviceName: configuredDeviceName,
      deviceModel: 'Samsung Galaxy A14 (Mock Gateway)',
      isOnline: true,
      batteryPercentage: 85,
      isCharging: true,
      networkType: 'WIFI',
      signalStrength: 4,
      lastSeenAt: nowIso,
      warningLevel: 'mock',
      statusText: 'Mock Device Gateway (Offline Development)',
      isMock: true,
      cached: false,
    };
  }

  const now = Date.now();

  // 2. Return cached health if valid and forceRefresh is not set
  if (!options?.forceRefresh && healthCache && now < healthCache.expiresAtMs) {
    return {
      ...healthCache.health,
      cached: true,
    };
  }

  // 3. Live API request
  const baseUrl = (
    process.env.TEXTBEE_API_URL ||
    process.env.TEXTBEE_BASE_URL ||
    TEXTBEE_DEFAULT_BASE_URL
  ).replace(/\/+$/, '');
  const url = `${baseUrl}/devices/${configuredDeviceId}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 3a. Authentication failure (HTTP 401 / 403)
    if (response.status === 401 || response.status === 403) {
      healthCache = null;
      return {
        success: false,
        deviceId: configuredDeviceId,
        deviceName: configuredDeviceName,
        isOnline: false,
        batteryPercentage: 0,
        isCharging: false,
        networkType: 'NONE',
        lastSeenAt: new Date(now).toISOString(),
        warningLevel: 'error',
        statusText: 'Gateway Authentication Failed',
        isMock: false,
        cached: false,
        errorMessage: 'Unauthorized: Verify TEXTBEE_API_KEY in environment configuration',
      };
    }

    // 3b. Device Not Found (HTTP 404)
    if (response.status === 404) {
      healthCache = null;
      return {
        success: false,
        deviceId: configuredDeviceId,
        deviceName: configuredDeviceName,
        isOnline: false,
        batteryPercentage: 0,
        isCharging: false,
        networkType: 'NONE',
        lastSeenAt: new Date(now).toISOString(),
        warningLevel: 'error',
        statusText: 'Device Not Found',
        isMock: false,
        cached: false,
        errorMessage: `Device ${configuredDeviceId} not registered in TextBee account`,
      };
    }

    // 3c. Non-200 responses
    if (!response.ok) {
      if (healthCache) {
        return {
          ...healthCache.health,
          cached: true,
          statusText: `Gateway Unreachable (${response.status}) - Showing Stale Cache`,
        };
      }

      return {
        success: false,
        deviceId: configuredDeviceId,
        deviceName: configuredDeviceName,
        isOnline: false,
        batteryPercentage: 0,
        isCharging: false,
        networkType: 'NONE',
        lastSeenAt: new Date(now).toISOString(),
        warningLevel: 'error',
        statusText: `Gateway Error (${response.status})`,
        isMock: false,
        cached: false,
        errorMessage: `TextBee gateway returned HTTP ${response.status}`,
      };
    }

    // 3d. Parse and normalize live device payload
    const rawData = (await response.json()) as TextBeeRawDeviceApiResponse;
    const deviceName = rawData.name || configuredDeviceName;
    const deviceModel = rawData.model;

    // Normalize online state
    let isOnline = false;
    if (typeof rawData.online === 'boolean') {
      isOnline = rawData.online;
    } else if (typeof rawData.status === 'string') {
      isOnline = rawData.status.toUpperCase() === 'ONLINE' || rawData.status.toUpperCase() === 'CONNECTED';
    }

    // Normalize battery
    let batteryPercentage = 100;
    let isCharging = false;
    if (typeof rawData.battery === 'number') {
      batteryPercentage = Math.max(0, Math.min(100, rawData.battery));
    } else if (typeof rawData.battery === 'object' && rawData.battery !== null) {
      const bObj = rawData.battery;
      const pct = bObj.percentage ?? bObj.level ?? 100;
      batteryPercentage = Math.max(0, Math.min(100, pct));
      isCharging = Boolean(bObj.isCharging || bObj.charging);
    } else if (typeof rawData.batteryLevel === 'number') {
      batteryPercentage = Math.max(0, Math.min(100, rawData.batteryLevel));
      isCharging = Boolean(rawData.isCharging);
    }

    // Normalize network
    let rawNetworkType: string | undefined;
    let signalStrength: number | undefined;
    if (typeof rawData.network === 'string') {
      rawNetworkType = rawData.network;
    } else if (typeof rawData.network === 'object' && rawData.network !== null) {
      rawNetworkType = rawData.network.type;
      signalStrength = rawData.network.signal;
    } else if (rawData.networkType) {
      rawNetworkType = rawData.networkType;
    }
    const networkType = normalizeNetworkType(rawNetworkType);

    const lastSeenAt = rawData.lastSeen || rawData.updatedAt || new Date(now).toISOString();

    const evaluation = evaluateDeviceHealthLevel({
      isOnline,
      batteryPercentage,
      isCharging,
      lastSeenAt,
      nowMs: now,
    });

    const isWarningOrCritical = evaluation.level === 'warning' || evaluation.level === 'critical';
    const ttlMs = isWarningOrCritical ? 5 * 60 * 1000 : 15 * 60 * 1000;
    const cachedAtIso = new Date(now).toISOString();
    const expiresAtIso = new Date(now + ttlMs).toISOString();

    const result: TextBeeDeviceHealth = {
      success: true,
      deviceId: rawData.id || rawData._id || configuredDeviceId,
      deviceName,
      deviceModel,
      isOnline,
      batteryPercentage,
      isCharging,
      networkType,
      signalStrength,
      lastSeenAt,
      warningLevel: evaluation.level,
      statusText: evaluation.statusText,
      isMock: false,
      cached: false,
      cachedAt: cachedAtIso,
      expiresAt: expiresAtIso,
    };

    healthCache = {
      health: result,
      cachedAtMs: now,
      expiresAtMs: now + ttlMs,
    };

    return result;
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    // Fallback to stale cache if available
    if (healthCache) {
      return {
        ...healthCache.health,
        cached: true,
        statusText: 'Gateway Unreachable - Showing Cached Device Health',
      };
    }

    const errMessage = err instanceof Error ? err.message : 'Unknown gateway communication error';

    return {
      success: false,
      deviceId: configuredDeviceId,
      deviceName: configuredDeviceName,
      isOnline: false,
      batteryPercentage: 0,
      isCharging: false,
      networkType: 'NONE',
      lastSeenAt: new Date(now).toISOString(),
      warningLevel: 'error',
      statusText: 'Gateway Unreachable',
      isMock: false,
      cached: false,
      errorMessage: errMessage,
    };
  }
}
