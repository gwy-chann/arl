import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  recordSmsDispatchLog,
  getSmsLogsBySaleId,
  getSmsLogsByCustomerId,
  getAllSmsLogs,
  _resetSmsAuditLogs,
  _getInMemorySmsAuditLogs,
} from '../../lib/services/sms-audit-service.ts';
import {
  createSmsDispatchLogSchema,
  mapRowToSmsDispatchLogDTO,
  type CreateSmsDispatchLogInput,
} from '../../lib/services/sms-audit-contracts.ts';
import {
  dispatchSms,
  _resetSmsHistory,
  dispatchOverdueBalanceReminders,
} from '../../lib/services/sms-service.ts';
import { _resetTextBeeMockHistory } from '../../lib/services/textbee-adapter.ts';
import { smsCircuitBreaker } from '../../lib/services/sms-resilience.ts';
import { resetInMemorySales } from '../../lib/sales/sale-service.ts';
import { resetMemoryCustomerStore, updateCustomer } from '../../lib/customers/customer-service.ts';
import { _resetSettingsStore, updateReminderSettings } from '../../lib/settings/settings-service.ts';

describe('Feature ARL-26: SMS Dispatch & Delivery Audit Ledger with Message ID Tracking', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.TEXTBEE_MOCK_DISPATCH = 'true';
    _resetSmsHistory();
    _resetSmsAuditLogs();
    _resetTextBeeMockHistory();
    smsCircuitBreaker.reset();
    resetInMemorySales();
    resetMemoryCustomerStore();
    _resetSettingsStore();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    _resetSmsHistory();
    _resetSmsAuditLogs();
    _resetTextBeeMockHistory();
    smsCircuitBreaker.reset();
  });

  describe('Contract & DTO Normalization', () => {
    it('validates a complete CreateSmsDispatchLogInput and parses successfully', () => {
      const input: CreateSmsDispatchLogInput = {
        saleId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        customerId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        recipientMobile: '09171234567',
        recipientType: 'CUSTOMER',
        messageBody: 'ARLQ Alert: Balance reminder',
        gatewayName: 'TEXTBEE',
        gatewayMessageId: 'textbee_msg_88412',
        status: 'SENT',
        latencyMs: 145,
      };

      const parsed = createSmsDispatchLogSchema.parse(input);
      assert.equal(parsed.recipientType, 'CUSTOMER');
      assert.equal(parsed.status, 'SENT');
      assert.equal(parsed.gatewayMessageId, 'textbee_msg_88412');
      assert.equal(parsed.latencyMs, 145);
    });

    it('rejects invalid recipient_type or unknown status in schema validation', () => {
      assert.throws(() => {
        createSmsDispatchLogSchema.parse({
          recipientMobile: '09171234567',
          recipientType: 'INVALID_ROLE',
          messageBody: 'Hello',
          status: 'SENT',
        });
      });

      assert.throws(() => {
        createSmsDispatchLogSchema.parse({
          recipientMobile: '09171234567',
          recipientType: 'CUSTOMER',
          messageBody: 'Hello',
          status: 'PENDING', // only SENT, FAILED, SKIPPED allowed
        });
      });

      assert.throws(() => {
        createSmsDispatchLogSchema.parse({
          recipientMobile: '',
          recipientType: 'ADMIN',
          messageBody: 'Alert',
          status: 'SENT',
        });
      });
    });

    it('maps database rows correctly providing both camelCase and snake_case properties', () => {
      const row = {
        id: 'log-101',
        sale_id: 'sale-202',
        customer_id: 'cust-303',
        recipient_mobile: '0917 123 4567',
        recipient_type: 'CUSTOMER',
        message_body: 'Notice',
        gateway_name: 'TEXTBEE',
        gateway_message_id: 'uid-999',
        status: 'SENT',
        error_reason: null,
        latency_ms: 120,
        dispatched_at: '2026-11-18T10:00:00.000Z',
        created_at: '2026-11-18T10:00:00.000Z',
      };

      const dto = mapRowToSmsDispatchLogDTO(row);
      assert.equal(dto.id, 'log-101');
      assert.equal(dto.saleId, 'sale-202');
      assert.equal(dto.sale_id, 'sale-202');
      assert.equal(dto.customerId, 'cust-303');
      assert.equal(dto.customer_id, 'cust-303');
      assert.equal(dto.gatewayMessageId, 'uid-999');
      assert.equal(dto.gateway_message_id, 'uid-999');
      assert.equal(dto.latencyMs, 120);
      assert.equal(dto.latency_ms, 120);
      assert.equal(dto.status, 'SENT');
    });
  });

  describe('Scenario: Audit entry recorded on successful TextBee dispatch', () => {
    it('records SENT audit log with TextBee uid, recipient type, and execution latency', async () => {
      const saleId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
      const customerId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

      const log = await recordSmsDispatchLog({
        saleId,
        customerId,
        recipientMobile: '09171234567',
        recipientType: 'CUSTOMER',
        messageBody: 'ARLQ Alert: Receipt #1001 balance of P1,500.00 is due.',
        gatewayName: 'TEXTBEE',
        gatewayMessageId: 'textbee_msg_88412',
        status: 'SENT',
        latencyMs: 142,
      });

      assert.ok(log.id, 'Expected generated ID for audit log');
      assert.equal(log.status, 'SENT');
      assert.equal(log.gatewayMessageId, 'textbee_msg_88412');
      assert.equal(log.recipientType, 'CUSTOMER');
      assert.equal(log.latencyMs, 142);
      assert.equal(log.saleId, saleId);
      assert.equal(log.customerId, customerId);
      assert.equal(log.errorReason, null);

      const inMemory = _getInMemorySmsAuditLogs();
      assert.equal(inMemory.length, 1);
      assert.equal(inMemory[0].gatewayMessageId, 'textbee_msg_88412');
    });
  });

  describe('Scenario: Audit entry recorded on gateway rejection or network failure', () => {
    it('records FAILED audit log with error_reason and null gateway_message_id', async () => {
      const log = await recordSmsDispatchLog({
        recipientMobile: '09171234567',
        recipientType: 'CUSTOMER',
        messageBody: 'Payment reminder',
        gatewayName: 'TEXTBEE',
        gatewayMessageId: null,
        status: 'FAILED',
        errorReason: 'HTTP 422: Recipient rejected by telco network',
        latencyMs: 250,
      });

      assert.equal(log.status, 'FAILED');
      assert.equal(log.gatewayMessageId, null);
      assert.equal(log.errorReason, 'HTTP 422: Recipient rejected by telco network');
      assert.equal(log.latencyMs, 250);
    });

    it('records FAILED log on gateway timeout', async () => {
      const log = await recordSmsDispatchLog({
        recipientMobile: '09171234567',
        recipientType: 'ADMIN',
        messageBody: 'Admin alert',
        status: 'FAILED',
        errorReason: 'Request aborted: 5000ms timeout',
        latencyMs: 5001,
      });

      assert.equal(log.status, 'FAILED');
      assert.equal(log.errorReason, 'Request aborted: 5000ms timeout');
      assert.equal(log.gatewayMessageId, null);
    });
  });

  describe('Scenario: Audit entry recorded when customer SMS is skipped', () => {
    it('records SKIPPED audit log with descriptive error_reason when phone is missing', async () => {
      const log = await recordSmsDispatchLog({
        recipientMobile: 'N/A',
        recipientType: 'CUSTOMER',
        messageBody: '[SKIPPED] Outstanding balance reminder',
        status: 'SKIPPED',
        errorReason: 'Customer phone number missing',
        latencyMs: 0,
      });

      assert.equal(log.status, 'SKIPPED');
      assert.equal(log.errorReason, 'Customer phone number missing');
      assert.equal(log.gatewayMessageId, null);
    });

    it('records SKIPPED audit log when 24h cooldown is active', async () => {
      const log = await recordSmsDispatchLog({
        recipientMobile: '09171234567',
        recipientType: 'CUSTOMER',
        messageBody: '[SKIPPED] Overdue balance reminder',
        status: 'SKIPPED',
        errorReason: 'Dispatched within last 24h cooldown',
      });

      assert.equal(log.status, 'SKIPPED');
      assert.equal(log.errorReason, 'Dispatched within last 24h cooldown');
    });
  });

  describe('Scenario: Querying audit history by sale ID and customer ID', () => {
    it('retrieves logs by saleId sorted by dispatched_at descending', async () => {
      const saleTarget = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380001';
      const saleOther = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380002';

      await recordSmsDispatchLog({
        saleId: saleTarget,
        recipientMobile: '09171111111',
        recipientType: 'CUSTOMER',
        messageBody: 'First nudge',
        status: 'SENT',
        gatewayMessageId: 'uid-1',
        dispatchedAt: '2026-11-18T08:00:00.000Z',
      });

      await recordSmsDispatchLog({
        saleId: saleOther,
        recipientMobile: '09172222222',
        recipientType: 'CUSTOMER',
        messageBody: 'Other sale',
        status: 'SENT',
        gatewayMessageId: 'uid-2',
        dispatchedAt: '2026-11-18T09:00:00.000Z',
      });

      await recordSmsDispatchLog({
        saleId: saleTarget,
        recipientMobile: '09171111111',
        recipientType: 'CUSTOMER',
        messageBody: 'Second nudge',
        status: 'SENT',
        gatewayMessageId: 'uid-3',
        dispatchedAt: '2026-11-18T10:00:00.000Z',
      });

      const results = await getSmsLogsBySaleId(saleTarget);
      assert.equal(results.length, 2);
      assert.equal(results[0].messageBody, 'Second nudge', 'Expected newest record first');
      assert.equal(results[1].messageBody, 'First nudge');
      assert.equal(results[0].gatewayMessageId, 'uid-3');
    });

    it('retrieves logs by customerId sorted by dispatched_at descending', async () => {
      const custId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380099';

      await recordSmsDispatchLog({
        customerId: custId,
        recipientMobile: '09179999999',
        recipientType: 'CUSTOMER',
        messageBody: 'Nudge A',
        status: 'SENT',
        gatewayMessageId: 'uid-a',
        dispatchedAt: '2026-11-17T12:00:00.000Z',
      });

      await recordSmsDispatchLog({
        customerId: custId,
        recipientMobile: '09179999999',
        recipientType: 'CUSTOMER',
        messageBody: 'Nudge B',
        status: 'FAILED',
        errorReason: 'Telco timeout',
        dispatchedAt: '2026-11-18T14:00:00.000Z',
      });

      const logs = await getSmsLogsByCustomerId(custId);
      assert.equal(logs.length, 2);
      assert.equal(logs[0].status, 'FAILED', 'Newer entry should be first');
      assert.equal(logs[1].status, 'SENT');
    });

    it('retrieves all logs with status and pagination filters', async () => {
      await recordSmsDispatchLog({
        recipientMobile: '09170000001',
        recipientType: 'CUSTOMER',
        messageBody: 'Log 1',
        status: 'SENT',
        gatewayMessageId: 'uid-1',
      });
      await recordSmsDispatchLog({
        recipientMobile: '09170000002',
        recipientType: 'ADMIN',
        messageBody: 'Log 2',
        status: 'FAILED',
        errorReason: 'Gateway down',
      });
      await recordSmsDispatchLog({
        recipientMobile: '09170000003',
        recipientType: 'CUSTOMER',
        messageBody: 'Log 3',
        status: 'SKIPPED',
        errorReason: 'Phone missing',
      });

      const all = await getAllSmsLogs();
      assert.equal(all.length, 3);

      const onlySent = await getAllSmsLogs({ status: 'SENT' });
      assert.equal(onlySent.length, 1);
      assert.equal(onlySent[0].status, 'SENT');

      const onlyAdmin = await getAllSmsLogs({ recipientType: 'ADMIN' });
      assert.equal(onlyAdmin.length, 1);
      assert.equal(onlyAdmin[0].recipientType, 'ADMIN');
    });
  });

  describe('Scenario: Integration via dispatchSms and Overdue Reminders', () => {
    it('dispatchSms automatically logs to audit ledger on successful gateway call', async () => {
      const result = await dispatchSms({
        recipientMobile: '0917 555 1234',
        recipientType: 'CUSTOMER',
        message: 'Friendly reminder: payment overdue',
      });

      assert.equal(result.success, true);
      const auditLogs = _getInMemorySmsAuditLogs();
      assert.ok(auditLogs.length >= 1, 'Expected at least 1 audit log created');
      const latest = auditLogs[0];
      assert.equal(latest.status, 'SENT');
      assert.ok(latest.gatewayMessageId, 'Expected gatewayMessageId to be set');
      assert.equal(latest.recipientType, 'CUSTOMER');
    });

    it('dispatchSms logs SKIPPED to audit ledger when phone number is invalid', async () => {
      const result = await dispatchSms({
        recipientMobile: '12345', // invalid Philippine mobile
        recipientType: 'CUSTOMER',
        message: 'Invalid phone test',
      });

      assert.equal(result.success, false);
      const auditLogs = _getInMemorySmsAuditLogs();
      assert.ok(auditLogs.length >= 1);
      const latest = auditLogs[0];
      assert.equal(latest.status, 'SKIPPED');
      assert.ok(latest.errorReason?.includes('Invalid Philippine mobile number'));
    });

    it('dispatchOverdueBalanceReminders records SKIPPED audit log when customer phone is missing', async () => {
      await updateReminderSettings({
        reminder_days: 7,
        admin_mobile: '0917 555 0142',
        notification_channel: 'SMS',
        notify_customer_sms: true,
      });

      // Update customer k1 to have an invalid phone
      await updateCustomer('k1', {
        name: "Aling Nena's Sari-Sari Store",
        phone: 'invalid-phone',
        address: 'Purok 3',
      });

      const asOfDate = new Date('2026-11-10T00:00:00Z');
      const sweep = await dispatchOverdueBalanceReminders({ asOfDate });

      assert.ok(sweep.adminSmsDispatched > 0);
      assert.ok(sweep.customerSmsSkipped > 0, 'Expected customer SMS to be skipped');

      const auditLogs = _getInMemorySmsAuditLogs();
      const skippedLog = auditLogs.find((l) => l.status === 'SKIPPED');
      assert.ok(skippedLog, 'Expected a SKIPPED audit log entry in ledger');
      assert.equal(skippedLog.errorReason, 'Customer phone number missing');
    });
  });

  describe('Supabase Client Graceful Error Handling', () => {
    it('handles Supabase insert errors gracefully without throwing to callers', async () => {
      const failingSupabase = {
        from: () => ({
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: null, error: { message: 'Database connection refused' } }),
            }),
          }),
        }),
      } as unknown as SupabaseClient;

      const log = await recordSmsDispatchLog(
        {
          recipientMobile: '09171234567',
          recipientType: 'CUSTOMER',
          messageBody: 'Resilient log test',
          status: 'SENT',
        },
        failingSupabase
      );

      assert.ok(log.id);
      assert.equal(log.status, 'SENT');
      assert.equal(log.recipientMobile, '09171234567');
    });
  });
});
