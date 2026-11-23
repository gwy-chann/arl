import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getTextBeeDeviceHealthAction,
  refreshTextBeeDeviceHealthAction,
  getSmsGatewayStatusAction,
} from '../../app/(admin)/settings/reminders/actions.ts';
import {
  formatBatteryLabel,
  evaluateDeviceHealthLevel,
  _resetTextBeeHealthCache,
  _setTestTextBeeHealthOverride,
} from '../../lib/services/textbee-health-service.ts';
import type { TextBeeDeviceHealth } from '../../lib/services/textbee-contracts.ts';

describe('Unit & Component Contract: SmsGatewayStatusCard & Server Actions (ARL-43)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    _resetTextBeeHealthCache();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    _resetTextBeeHealthCache();
  });

  describe('1. Server Actions Execution & Response Contracts', () => {
    it('getTextBeeDeviceHealthAction returns mock health when offline/unconfigured', async () => {
      delete process.env.TEXTBEE_API_KEY;
      const result = await getTextBeeDeviceHealthAction();

      assert.strictEqual(result.success, true);
      assert.ok(result.data);
      assert.strictEqual(result.data.isMock, true);
      assert.strictEqual(result.data.batteryPercentage, 85);
      assert.strictEqual(result.data.isCharging, true);
      assert.strictEqual(result.data.warningLevel, 'mock');
    });

    it('refreshTextBeeDeviceHealthAction forces cache bypass and returns fresh status', async () => {
      const mockHealth: TextBeeDeviceHealth = {
        success: true,
        deviceId: 'device_forced_refresh',
        deviceName: 'Warehouse Scanner Phone',
        isOnline: true,
        batteryPercentage: 92,
        isCharging: true,
        networkType: 'WIFI',
        lastSeenAt: new Date().toISOString(),
        warningLevel: 'healthy',
        statusText: 'Connected (TextBee Gateway)',
        isMock: true,
        cached: false,
      };

      _setTestTextBeeHealthOverride(mockHealth);

      const result = await refreshTextBeeDeviceHealthAction({ forceRefresh: true });
      assert.strictEqual(result.success, true);
      assert.ok(result.data);
      assert.strictEqual(result.data.deviceId, 'device_forced_refresh');
      assert.strictEqual(result.data.batteryPercentage, 92);
    });

    it('getSmsGatewayStatusAction returns TextBee device diagnostic', async () => {
      const mockTextBee: TextBeeDeviceHealth = {
        success: true,
        deviceId: 'device_primary',
        deviceName: 'Primary Gateway Phone',
        isOnline: true,
        batteryPercentage: 78,
        isCharging: false,
        networkType: 'CELLULAR',
        lastSeenAt: new Date().toISOString(),
        warningLevel: 'healthy',
        statusText: 'Connected (TextBee Gateway)',
        isMock: true,
        cached: false,
      };

      _setTestTextBeeHealthOverride(mockTextBee);

      const result = await getSmsGatewayStatusAction();
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.activeGateway, 'TEXTBEE');
      assert.strictEqual(result.textbee?.batteryPercentage, 78);
    });
  });

  describe('2. Component State Invariants & Threshold Transitions', () => {
    it('evaluates critical battery state (<10%) correctly for UI alert banner', () => {
      const evalResult = evaluateDeviceHealthLevel({
        isOnline: true,
        batteryPercentage: 7,
        isCharging: false,
      });

      assert.strictEqual(evalResult.level, 'critical');
      assert.match(evalResult.statusText, /Critical Battery/i);
    });

    it('evaluates low battery warning state (10%-19%) correctly for UI warning banner', () => {
      const evalResult = evaluateDeviceHealthLevel({
        isOnline: true,
        batteryPercentage: 15,
        isCharging: false,
      });

      assert.strictEqual(evalResult.level, 'warning');
      assert.match(evalResult.statusText, /Low Battery/i);
    });

    it('clears battery warning when device is plugged into charger', () => {
      const evalResult = evaluateDeviceHealthLevel({
        isOnline: true,
        batteryPercentage: 12,
        isCharging: true,
      });

      assert.strictEqual(evalResult.level, 'healthy');
      assert.strictEqual(evalResult.statusText, 'Connected (TextBee Gateway)');
    });

    it('formats battery badge string accurately across discharging, charging, and mock states', () => {
      assert.strictEqual(formatBatteryLabel(55, false, false), '55%');
      assert.strictEqual(formatBatteryLabel(55, true, false), '55% (Charging)');
      assert.strictEqual(formatBatteryLabel(85, true, true), '85% (Local Mock)');
    });
  });
});
