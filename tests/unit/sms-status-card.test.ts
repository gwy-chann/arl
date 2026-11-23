import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getTextBeeDeviceHealthAction,
  refreshTextBeeDeviceHealthAction,
  getSmsGatewayStatusAction,
  getPhilSmsAccountStatusAction,
  refreshPhilSmsBalanceAction,
} from '../../app/(admin)/settings/reminders/actions.ts';
import {
  formatBatteryLabel,
  evaluateDeviceHealthLevel,
  _resetTextBeeHealthCache,
  _setTestTextBeeHealthOverride,
} from '../../lib/services/textbee-health-service.ts';
import {
  _resetPhilSmsBalanceCache,
  _setTestPhilSmsBalanceOverride,
} from '../../lib/services/philsms-balance-service.ts';
import type { TextBeeDeviceHealth } from '../../lib/services/textbee-contracts.ts';
import type { PhilSmsAccountStatus } from '../../lib/services/philsms-contracts.ts';

describe('Unit & Component Contract: SmsGatewayStatusCard & Server Actions (ARL-43)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    _resetTextBeeHealthCache();
    _resetPhilSmsBalanceCache();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    _resetTextBeeHealthCache();
    _resetPhilSmsBalanceCache();
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

    it('getSmsGatewayStatusAction aggregates both PhilSMS and TextBee diagnostics', async () => {
      const mockPhil: PhilSmsAccountStatus = {
        success: true,
        balance: 250,
        currency: 'PHP',
        senderId: 'ARLQ',
        isMock: true,
        cached: false,
        warningLevel: 'healthy',
        statusText: 'Connected (PhilSMS Gateway)',
      };

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

      _setTestPhilSmsBalanceOverride(mockPhil);
      _setTestTextBeeHealthOverride(mockTextBee);

      const philRes = await getPhilSmsAccountStatusAction();
      assert.strictEqual(philRes.success, true);
      assert.strictEqual(philRes.data?.balance, 250);

      const philRefresh = await refreshPhilSmsBalanceAction({ forceRefresh: true });
      assert.strictEqual(philRefresh.success, true);

      const result = await getSmsGatewayStatusAction();
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.activeGateway, 'DUAL');
      assert.strictEqual(result.philsms?.balance, 250);
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
