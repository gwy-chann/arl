import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateDeviceHealthLevel,
  formatBatteryLabel,
  normalizeNetworkType,
  getTextBeeDeviceHealth,
  _resetTextBeeHealthCache,
  _setTestTextBeeHealthOverride,
} from '../lib/services/textbee-health-service.ts';
import type { TextBeeDeviceHealth } from '../lib/services/textbee-contracts.ts';

describe('Feature ARL-43: TextBee Device Connection Health Diagnostic & Battery Monitor', () => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
    _resetTextBeeHealthCache();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    globalThis.fetch = originalFetch;
    _resetTextBeeHealthCache();
  });

  describe('1. Device Health & Battery Evaluation Logic', () => {
    const baseNow = 1700000000000;

    it('evaluates offline device as critical', () => {
      const res = evaluateDeviceHealthLevel({
        isOnline: false,
        batteryPercentage: 90,
        isCharging: false,
        nowMs: baseNow,
      });
      assert.strictEqual(res.level, 'critical');
      assert.strictEqual(res.statusText, 'Device Offline');
    });

    it('evaluates stale heartbeat (>30m) as critical offline state', () => {
      const staleLastSeen = new Date(baseNow - 35 * 60 * 1000).toISOString();
      const res = evaluateDeviceHealthLevel({
        isOnline: true,
        batteryPercentage: 80,
        isCharging: false,
        lastSeenAt: staleLastSeen,
        nowMs: baseNow,
      });
      assert.strictEqual(res.level, 'critical');
      assert.match(res.statusText, /Heartbeat > 30m/i);
    });

    it('evaluates battery < 10% while discharging as critical', () => {
      const freshPing = new Date(baseNow - 60 * 1000).toISOString();
      const res = evaluateDeviceHealthLevel({
        isOnline: true,
        batteryPercentage: 8,
        isCharging: false,
        lastSeenAt: freshPing,
        nowMs: baseNow,
      });
      assert.strictEqual(res.level, 'critical');
      assert.match(res.statusText, /Critical Battery Alert/i);
    });

    it('treats battery < 10% as healthy when actively charging', () => {
      const freshPing = new Date(baseNow - 60 * 1000).toISOString();
      const res = evaluateDeviceHealthLevel({
        isOnline: true,
        batteryPercentage: 8,
        isCharging: true,
        lastSeenAt: freshPing,
        nowMs: baseNow,
      });
      assert.strictEqual(res.level, 'healthy');
      assert.strictEqual(res.statusText, 'Connected (TextBee Gateway)');
    });

    it('evaluates battery between 10% and 19% while discharging as warning', () => {
      const freshPing = new Date(baseNow - 60 * 1000).toISOString();
      const res = evaluateDeviceHealthLevel({
        isOnline: true,
        batteryPercentage: 18,
        isCharging: false,
        lastSeenAt: freshPing,
        nowMs: baseNow,
      });
      assert.strictEqual(res.level, 'warning');
      assert.match(res.statusText, /Low Battery Warning/i);
    });

    it('evaluates delayed heartbeat (>15m, <=30m) as warning', () => {
      const delayedPing = new Date(baseNow - 20 * 60 * 1000).toISOString();
      const res = evaluateDeviceHealthLevel({
        isOnline: true,
        batteryPercentage: 75,
        isCharging: false,
        lastSeenAt: delayedPing,
        nowMs: baseNow,
      });
      assert.strictEqual(res.level, 'warning');
      assert.match(res.statusText, /Heartbeat Delayed/i);
    });

    it('evaluates healthy device with normal battery and fresh heartbeat', () => {
      const freshPing = new Date(baseNow - 2 * 60 * 1000).toISOString();
      const res = evaluateDeviceHealthLevel({
        isOnline: true,
        batteryPercentage: 85,
        isCharging: false,
        lastSeenAt: freshPing,
        nowMs: baseNow,
      });
      assert.strictEqual(res.level, 'healthy');
      assert.strictEqual(res.statusText, 'Connected (TextBee Gateway)');
    });
  });

  describe('2. Formatting & Normalization Helpers', () => {
    it('formats battery label for standard discharging', () => {
      assert.strictEqual(formatBatteryLabel(45, false), '45%');
    });

    it('formats battery label with charging indicator', () => {
      assert.strictEqual(formatBatteryLabel(45, true), '45% (Charging)');
    });

    it('formats battery label for local mock mode', () => {
      assert.strictEqual(formatBatteryLabel(85, true, true), '85% (Local Mock)');
    });

    it('normalizes network types accurately', () => {
      assert.strictEqual(normalizeNetworkType('WIFI'), 'WIFI');
      assert.strictEqual(normalizeNetworkType('wi-fi 5ghz'), 'WIFI');
      assert.strictEqual(normalizeNetworkType('Cellular LTE'), 'CELLULAR');
      assert.strictEqual(normalizeNetworkType('5G Mobile'), 'CELLULAR');
      assert.strictEqual(normalizeNetworkType('Ethernet'), 'ETHERNET');
      assert.strictEqual(normalizeNetworkType(null), 'UNKNOWN');
      assert.strictEqual(normalizeNetworkType('offline'), 'NONE');
    });
  });

  describe('3. Offline Mock Mode Fallback', () => {
    it('returns high-fidelity mock health when TEXTBEE_API_KEY is not configured', async () => {
      delete process.env.TEXTBEE_API_KEY;
      const health = await getTextBeeDeviceHealth();

      assert.strictEqual(health.success, true);
      assert.strictEqual(health.isMock, true);
      assert.strictEqual(health.isOnline, true);
      assert.strictEqual(health.batteryPercentage, 85);
      assert.strictEqual(health.isCharging, true);
      assert.strictEqual(health.warningLevel, 'mock');
      assert.match(health.statusText, /Mock Device Gateway/i);
    });

    it('returns mock health when TEXTBEE_MOCK_HEALTH is explicitly true', async () => {
      process.env.TEXTBEE_API_KEY = 'secret_key';
      process.env.TEXTBEE_MOCK_HEALTH = 'true';
      const health = await getTextBeeDeviceHealth();

      assert.strictEqual(health.success, true);
      assert.strictEqual(health.isMock, true);
    });
  });

  describe('4. Live Gateway Fetch & Normalization', () => {
    it('fetches and parses live device data successfully', async () => {
      process.env.TEXTBEE_API_KEY = 'test_api_key';
      process.env.TEXTBEE_DEVICE_ID = 'dev_123';
      delete process.env.TEXTBEE_MOCK_HEALTH;
      delete process.env.TEXTBEE_MOCK_DISPATCH;

      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({
            id: 'dev_123',
            name: 'Store Reception Phone',
            model: 'Samsung Galaxy A14',
            online: true,
            battery: {
              percentage: 72,
              isCharging: true,
            },
            network: {
              type: 'WIFI',
              signal: 4,
            },
            lastSeen: new Date().toISOString(),
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const health = await getTextBeeDeviceHealth();

      assert.strictEqual(health.success, true);
      assert.strictEqual(health.isMock, false);
      assert.strictEqual(health.cached, false);
      assert.strictEqual(health.deviceId, 'dev_123');
      assert.strictEqual(health.deviceName, 'Store Reception Phone');
      assert.strictEqual(health.deviceModel, 'Samsung Galaxy A14');
      assert.strictEqual(health.batteryPercentage, 72);
      assert.strictEqual(health.isCharging, true);
      assert.strictEqual(health.networkType, 'WIFI');
      assert.strictEqual(health.warningLevel, 'healthy');
    });

    it('handles HTTP 401 unauthorized gracefully', async () => {
      process.env.TEXTBEE_API_KEY = 'invalid_key';
      process.env.TEXTBEE_DEVICE_ID = 'dev_123';
      delete process.env.TEXTBEE_MOCK_HEALTH;
      delete process.env.TEXTBEE_MOCK_DISPATCH;

      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({ message: 'Invalid API Key' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const health = await getTextBeeDeviceHealth();

      assert.strictEqual(health.success, false);
      assert.strictEqual(health.warningLevel, 'error');
      assert.strictEqual(health.statusText, 'Gateway Authentication Failed');
    });

    it('handles HTTP 404 device not found gracefully', async () => {
      process.env.TEXTBEE_API_KEY = 'valid_key';
      process.env.TEXTBEE_DEVICE_ID = 'non_existent_device';
      delete process.env.TEXTBEE_MOCK_HEALTH;
      delete process.env.TEXTBEE_MOCK_DISPATCH;

      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({ message: 'Device not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const health = await getTextBeeDeviceHealth();

      assert.strictEqual(health.success, false);
      assert.strictEqual(health.warningLevel, 'error');
      assert.strictEqual(health.statusText, 'Device Not Found');
    });
  });

  describe('5. In-Memory Caching & Stale-While-Error Fallback', () => {
    it('returns cached data on repeated calls within TTL', async () => {
      process.env.TEXTBEE_API_KEY = 'test_key';
      delete process.env.TEXTBEE_MOCK_HEALTH;
      delete process.env.TEXTBEE_MOCK_DISPATCH;

      let callCount = 0;
      globalThis.fetch = async () => {
        callCount += 1;
        return new Response(
          JSON.stringify({
            id: 'dev_123',
            name: 'Device 1',
            online: true,
            battery: 80,
            network: 'WIFI',
            lastSeen: new Date().toISOString(),
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const first = await getTextBeeDeviceHealth();
      assert.strictEqual(first.cached, false);
      assert.strictEqual(callCount, 1);

      const second = await getTextBeeDeviceHealth();
      assert.strictEqual(second.cached, true);
      assert.strictEqual(callCount, 1);
    });

    it('bypasses cache when forceRefresh is true', async () => {
      process.env.TEXTBEE_API_KEY = 'test_key';
      delete process.env.TEXTBEE_MOCK_HEALTH;
      delete process.env.TEXTBEE_MOCK_DISPATCH;

      let callCount = 0;
      globalThis.fetch = async () => {
        callCount += 1;
        return new Response(
          JSON.stringify({
            id: 'dev_123',
            name: 'Device 1',
            online: true,
            battery: 80,
            network: 'WIFI',
            lastSeen: new Date().toISOString(),
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      await getTextBeeDeviceHealth();
      assert.strictEqual(callCount, 1);

      const refreshed = await getTextBeeDeviceHealth({ forceRefresh: true });
      assert.strictEqual(refreshed.cached, false);
      assert.strictEqual(callCount, 2);
    });

    it('falls back to stale cache with warning indicator if live network request fails', async () => {
      process.env.TEXTBEE_API_KEY = 'test_key';
      delete process.env.TEXTBEE_MOCK_HEALTH;
      delete process.env.TEXTBEE_MOCK_DISPATCH;

      let callCount = 0;
      globalThis.fetch = async () => {
        callCount += 1;
        if (callCount === 1) {
          return new Response(
            JSON.stringify({
              id: 'dev_123',
              name: 'Device 1',
              online: true,
              battery: 80,
              network: 'WIFI',
              lastSeen: new Date().toISOString(),
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        throw new Error('Network timeout');
      };

      const first = await getTextBeeDeviceHealth();
      assert.strictEqual(first.success, true);

      // Force refresh with broken network
      const fallback = await getTextBeeDeviceHealth({ forceRefresh: true });
      assert.strictEqual(fallback.success, true);
      assert.strictEqual(fallback.cached, true);
      assert.match(fallback.statusText, /Showing Cached Device Health/i);
    });
  });

  describe('6. Test Override Harness', () => {
    it('returns test override status immediately when injected', async () => {
      const customOverride: TextBeeDeviceHealth = {
        success: true,
        deviceId: 'custom_test_dev',
        deviceName: 'Custom Mock Phone',
        isOnline: true,
        batteryPercentage: 99,
        isCharging: false,
        networkType: 'CELLULAR',
        lastSeenAt: new Date().toISOString(),
        warningLevel: 'healthy',
        statusText: 'Connected (Custom Test Override)',
        isMock: true,
        cached: false,
      };

      _setTestTextBeeHealthOverride(customOverride);

      const health = await getTextBeeDeviceHealth();
      assert.strictEqual(health.deviceId, 'custom_test_dev');
      assert.strictEqual(health.batteryPercentage, 99);
      assert.strictEqual(health.networkType, 'CELLULAR');
    });
  });
});
