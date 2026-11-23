import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveSmsGatewayProvider,
  dispatchGatewaySms,
  normalizeProviderName,
  _setMockGatewayHandler,
  _resetGatewayRouterMock,
} from '../lib/services/sms-gateway-router.ts';
import {
  _setMockTextBeeSendHandler,
  _resetTextBeeSendMock,
} from '../lib/services/textbee-adapter.ts';
import {
  _resetPhilSmsMockHistory,
} from '../lib/services/philsms-adapter.ts';
import {
  dispatchSmsSafe,
  smsCircuitBreaker,
  CircuitBreaker,
} from '../lib/services/sms-resilience.ts';
import {
  dispatchSms,
  _resetSmsHistory,
} from '../lib/services/sms-service.ts';
import { _resetSmsAuditLogs, _getInMemorySmsAuditLogs } from '../lib/services/sms-audit-service.ts';

describe('Feature ARL-41: Pluggable Multi-Gateway Router & Dynamic Provider Switcher', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.SMS_GATEWAY_PROVIDER;
    delete process.env.ACTIVE_SMS_GATEWAY;
    delete process.env.TEXTBEE_API_KEY;
    process.env.PHILSMS_MOCK_DISPATCH = 'true';
    process.env.TEXTBEE_MOCK_DISPATCH = 'true';

    _resetGatewayRouterMock();
    _resetTextBeeSendMock();
    _resetPhilSmsMockHistory();
    _resetSmsHistory();
    _resetSmsAuditLogs();
    smsCircuitBreaker.reset();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    _resetGatewayRouterMock();
    _resetTextBeeSendMock();
    _resetPhilSmsMockHistory();
    _resetSmsHistory();
    _resetSmsAuditLogs();
    smsCircuitBreaker.reset();
  });

  describe('1. Provider Name Normalization & Resolution Hierarchy', () => {
    it('normalizes provider strings case-insensitively and trims whitespace', () => {
      assert.equal(normalizeProviderName('textbee'), 'textbee');
      assert.equal(normalizeProviderName('TEXTBEE'), 'textbee');
      assert.equal(normalizeProviderName(' TextBee '), 'textbee');
      assert.equal(normalizeProviderName('philsms'), 'philsms');
      assert.equal(normalizeProviderName('PHILSMS'), 'philsms');
      assert.equal(normalizeProviderName('mock'), 'mock');
      assert.equal(normalizeProviderName('MOCK'), 'mock');
      assert.equal(normalizeProviderName('invalid-provider'), null);
      assert.equal(normalizeProviderName(null), null);
      assert.equal(normalizeProviderName(undefined), null);
    });

    it('gives explicit call options the highest resolution priority', () => {
      process.env.SMS_GATEWAY_PROVIDER = 'philsms';
      process.env.TEXTBEE_API_KEY = 'tb_secret_key';

      // Explicit override in options wins over env var and auto-detection
      const resolved = resolveSmsGatewayProvider({ provider: 'textbee' });
      assert.equal(resolved, 'textbee');

      const resolvedMock = resolveSmsGatewayProvider({ provider: 'mock' });
      assert.equal(resolvedMock, 'mock');
    });

    it('resolves provider from SMS_GATEWAY_PROVIDER environment variable', () => {
      process.env.SMS_GATEWAY_PROVIDER = 'textbee';
      assert.equal(resolveSmsGatewayProvider(), 'textbee');

      process.env.SMS_GATEWAY_PROVIDER = 'PHILSMS';
      assert.equal(resolveSmsGatewayProvider(), 'philsms');

      process.env.SMS_GATEWAY_PROVIDER = 'mock';
      assert.equal(resolveSmsGatewayProvider(), 'mock');
    });

    it('falls back to legacy ACTIVE_SMS_GATEWAY environment variable if present', () => {
      delete process.env.SMS_GATEWAY_PROVIDER;
      process.env.ACTIVE_SMS_GATEWAY = 'TEXTBEE';
      assert.equal(resolveSmsGatewayProvider(), 'textbee');
    });

    it('smart auto-detection defaults to textbee when TEXTBEE_API_KEY is configured', () => {
      delete process.env.SMS_GATEWAY_PROVIDER;
      delete process.env.ACTIVE_SMS_GATEWAY;
      process.env.TEXTBEE_API_KEY = 'textbee_active_key_123';

      assert.equal(resolveSmsGatewayProvider(), 'textbee');
    });

    it('smart auto-detection defaults to philsms when TEXTBEE_API_KEY is missing', () => {
      delete process.env.SMS_GATEWAY_PROVIDER;
      delete process.env.ACTIVE_SMS_GATEWAY;
      delete process.env.TEXTBEE_API_KEY;

      assert.equal(resolveSmsGatewayProvider(), 'philsms');
    });
  });

  describe('2. Dispatch Gateway Routing & Response Normalization', () => {
    it('routes to TextBee and normalizes successful outcome', async () => {
      process.env.SMS_GATEWAY_PROVIDER = 'textbee';

      const result = await dispatchGatewaySms({
        recipient: '09171234567',
        message: 'Hello via TextBee Gateway Router',
      });

      assert.equal(result.success, true);
      assert.equal(result.provider, 'textbee');
      assert.ok(result.messageId);
      assert.equal(typeof result.messageId, 'string');
    });

    it('routes to PhilSMS and normalizes successful outcome', async () => {
      process.env.SMS_GATEWAY_PROVIDER = 'philsms';

      const result = await dispatchGatewaySms({
        recipient: '09171234567',
        message: 'Hello via PhilSMS Gateway Router',
      });

      assert.equal(result.success, true);
      assert.equal(result.provider, 'philsms');
      assert.ok(result.messageId);
      assert.equal(typeof result.messageId, 'string');
    });

    it('routes to mock provider and returns synthetic response', async () => {
      process.env.SMS_GATEWAY_PROVIDER = 'mock';

      const result = await dispatchGatewaySms({
        recipient: '09171234567',
        message: 'Hello via Mock Gateway',
      });

      assert.equal(result.success, true);
      assert.equal(result.provider, 'mock');
      assert.ok(result.messageId?.startsWith('mock_router_'));
    });

    it('supports test handler injection and resetting', async () => {
      let intercepted = false;
      _setMockGatewayHandler(async () => {
        intercepted = true;
        return {
          success: true,
          messageId: 'intercepted_123',
          provider: 'mock',
        };
      });

      const result = await dispatchGatewaySms({
        recipient: '09171234567',
        message: 'Test custom injection',
      });

      assert.equal(intercepted, true);
      assert.equal(result.messageId, 'intercepted_123');

      _resetGatewayRouterMock();

      process.env.SMS_GATEWAY_PROVIDER = 'textbee';
      const normalResult = await dispatchGatewaySms({
        recipient: '09171234567',
        message: 'Test after reset',
      });
      assert.equal(normalResult.provider, 'textbee');
    });
  });

  describe('3. Error Mapping & Adapter Normalization', () => {
    it('normalizes TextBee device disconnection error into UnifiedSmsDispatchResult', async () => {
      _setMockTextBeeSendHandler(async () => {
        return {
          success: false,
          errorCode: 'DEVICE_OFFLINE',
          errorMessage: 'Physical Android gateway device is offline',
        };
      });

      const result = await dispatchGatewaySms({
        recipient: '09171234567',
        message: 'Notice',
        provider: 'textbee',
      });

      assert.equal(result.success, false);
      assert.equal(result.provider, 'textbee');
      assert.equal(result.errorCode, 'DEVICE_OFFLINE');
      assert.equal(result.errorMessage, 'Physical Android gateway device is offline');
    });

    it('normalizes PhilSMS error into UnifiedSmsDispatchResult', async () => {
      const result = await dispatchGatewaySms({
        recipient: '', // Empty recipient triggers PhilSMS error
        message: 'Notice',
        provider: 'philsms',
      });

      assert.equal(result.success, false);
      assert.equal(result.provider, 'philsms');
      assert.equal(result.errorCode, 'INVALID_RECIPIENT_MOBILE');
    });
  });

  describe('4. Seamless Resilience Integration with sms-resilience.ts', () => {
    it('dispatches through router inside dispatchSmsSafe and records success', async () => {
      process.env.SMS_GATEWAY_PROVIDER = 'textbee';

      const safeResult = await dispatchSmsSafe({
        recipientMobile: '09171234567',
        recipientType: 'CUSTOMER',
        message: 'Customer Reminder Text',
      });

      assert.equal(safeResult.success, true);
      assert.ok(safeResult.messageId);
      assert.equal(safeResult.circuitState, 'CLOSED');
    });

    it('trips circuit breaker on repeated router failures from transient errors', async () => {
      _setMockTextBeeSendHandler(async () => {
        return {
          success: false,
          errorCode: 'DEVICE_OFFLINE',
          errorMessage: 'Phone disconnected from Wi-Fi',
        };
      });

      const customBreaker = new CircuitBreaker({
        failureThreshold: 3,
        cooldownMs: 60000,
        maxRetries: 0,
      });

      for (let i = 0; i < 3; i++) {
        const res = await dispatchSmsSafe(
          {
            recipientMobile: '09171234567',
            recipientType: 'CUSTOMER',
            message: 'Reminder',
          },
          { gateway: 'TEXTBEE' },
          customBreaker
        );
        assert.equal(res.success, false);
      }

      assert.equal(customBreaker.getState(), 'OPEN');

      // Subsequent call fast-fails immediately
      const fastFail = await dispatchSmsSafe(
        {
          recipientMobile: '09171234567',
          recipientType: 'CUSTOMER',
          message: 'Suppressed Reminder',
        },
        { gateway: 'TEXTBEE' },
        customBreaker
      );

      assert.equal(fastFail.success, false);
      assert.equal(fastFail.errorCode, 'CIRCUIT_OPEN');
      assert.ok(fastFail.durationMs < 50);
    });

    it('integrates seamlessly with high-level dispatchSms and audit logs', async () => {
      process.env.SMS_GATEWAY_PROVIDER = 'textbee';

      const dispatchRes = await dispatchSms({
        recipientMobile: '09171234567',
        recipientType: 'CUSTOMER',
        message: 'End-to-End Dynamic Route Test',
        saleId: 'sale_123',
        customerId: 'cust_456',
      });

      assert.equal(dispatchRes.success, true);

      // Verify audit log has gatewayName = 'TEXTBEE'
      const logs = _getInMemorySmsAuditLogs();
      assert.equal(logs.length, 1);
      assert.equal(logs[0].gateway_name, 'TEXTBEE');
      assert.equal(logs[0].status, 'SENT');
      assert.equal(logs[0].sale_id, 'sale_123');
    });
  });
});
