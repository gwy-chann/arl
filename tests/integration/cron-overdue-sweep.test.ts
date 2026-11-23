import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  isAuthorizedCronRequest,
  executeOverdueSmsSweep,
  type CronSweepSummary,
} from '../../lib/services/sms-cron-service.ts';
import { GET, POST } from '../../app/api/cron/overdue-sms-sweep/route.ts';
import {
  _resetSmsHistory,
  _getDispatchedSmsHistory,
} from '../../lib/services/sms-service.ts';
import {
  _resetSmsAuditLogs,
  _getInMemorySmsAuditLogs,
} from '../../lib/services/sms-audit-service.ts';
import {
  updateReminderSettings,
  _resetSettingsStore,
} from '../../lib/settings/settings-service.ts';
import {
  resetInMemorySales,
  _setInMemorySales,
  _getInMemorySales,
} from '../../lib/sales/sale-service.ts';
import { resetMemoryCustomerStore } from '../../lib/customers/customer-service.ts';
import { smsCircuitBreaker } from '../../lib/services/sms-resilience.ts';
import type { SaleTransactionDTO } from '../../lib/sales/sale-contracts.ts';

function createMockOverdueSale(params: {
  id: string;
  receiptNumber: string;
  balance: number;
  daysAgo: number;
  lastSmsSentAt?: string | null;
  customerPhone?: string;
  customerName?: string;
  asOfDate?: Date;
}): SaleTransactionDTO {
  const asOf = params.asOfDate || new Date('2026-11-18T00:00:00Z');
  const createdAt = new Date(asOf.getTime() - params.daysAgo * 24 * 60 * 60 * 1000).toISOString();

  return {
    id: params.id,
    receipt_number: params.receiptNumber,
    customer_id: `cust-${params.id}`,
    customer_name: params.customerName || `Customer ${params.id}`,
    customer_phone: params.customerPhone !== undefined ? params.customerPhone : '0917 301 4488',
    customer_address: 'Barangay Central, Manila',
    total_amount: params.balance + 100,
    amount_paid: 100,
    balance: params.balance,
    payment_status: 'Partially Paid',
    order_status: 'Delivered',
    gross_profit: 50,
    items: [],
    created_at: createdAt,
    updated_at: createdAt,
    last_sms_sent_at: params.lastSmsSentAt || null,
  };
}

describe('Feature ARL-28: Scheduled Overdue SMS Sweep Orchestrator (Cron / Background Worker)', () => {
  const originalEnv = { ...process.env };
  const TEST_SECRET = 'super-secret-cron-token-1234567890';

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.CRON_SECRET = TEST_SECRET;
    process.env.TEXTBEE_MOCK_DISPATCH = 'true';
    _resetSmsHistory();
    _resetSmsAuditLogs();
    _resetSettingsStore();
    resetInMemorySales();
    resetMemoryCustomerStore();
    smsCircuitBreaker.reset();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    _resetSmsHistory();
    _resetSmsAuditLogs();
    smsCircuitBreaker.reset();
  });

  describe('Security & Constant-Time Authorization Guard', () => {
    it('authenticates valid Bearer token matching CRON_SECRET', () => {
      const authorized = isAuthorizedCronRequest(`Bearer ${TEST_SECRET}`, TEST_SECRET);
      assert.equal(authorized, true);
    });

    it('rejects when Authorization header is missing or null', () => {
      assert.equal(isAuthorizedCronRequest(null, TEST_SECRET), false);
      assert.equal(isAuthorizedCronRequest('', TEST_SECRET), false);
    });

    it('rejects when Authorization header does not begin with "Bearer "', () => {
      assert.equal(isAuthorizedCronRequest(`Basic ${TEST_SECRET}`, TEST_SECRET), false);
      assert.equal(isAuthorizedCronRequest(TEST_SECRET, TEST_SECRET), false);
    });

    it('rejects when token length does not match secret length', () => {
      assert.equal(isAuthorizedCronRequest('Bearer short', TEST_SECRET), false);
      assert.equal(isAuthorizedCronRequest(`Bearer ${TEST_SECRET}extra`, TEST_SECRET), false);
    });

    it('rejects when token characters differ from secret (timing-safe check)', () => {
      const tampered = TEST_SECRET.slice(0, -1) + (TEST_SECRET.endsWith('a') ? 'b' : 'a');
      assert.equal(isAuthorizedCronRequest(`Bearer ${tampered}`, TEST_SECRET), false);
    });

    it('rejects when CRON_SECRET environment variable is unset', () => {
      delete process.env.CRON_SECRET;
      assert.equal(isAuthorizedCronRequest(`Bearer ${TEST_SECRET}`, undefined), false);
    });
  });

  describe('Route Handler Authentication & Method Support', () => {
    it('returns HTTP 401 Unauthorized on GET when authorization header is missing', async () => {
      const request = new Request('http://localhost:3000/api/cron/overdue-sms-sweep', {
        method: 'GET',
      });
      const response = await GET(request);
      assert.equal(response.status, 401);

      const json = await response.json();
      assert.equal(json.success, false);
      assert.match(json.error, /Unauthorized/);
    });

    it('returns HTTP 401 Unauthorized on GET when token is invalid', async () => {
      const request = new Request('http://localhost:3000/api/cron/overdue-sms-sweep', {
        method: 'GET',
        headers: { authorization: 'Bearer wrong-secret-token' },
      });
      const response = await GET(request);
      assert.equal(response.status, 401);
    });

    it('returns HTTP 401 Unauthorized on POST when unauthenticated', async () => {
      const request = new Request('http://localhost:3000/api/cron/overdue-sms-sweep', {
        method: 'POST',
      });
      const response = await POST(request);
      assert.equal(response.status, 401);
    });
  });

  describe('Scenario 1: Authorized morning cron execution dispatches overdue alerts', () => {
    it('evaluates 3 unpaid sales past 7-day threshold and dispatches dual alerts', async () => {
      const asOfDate = new Date('2026-11-18T00:00:00Z');

      // Configure system settings with customer SMS enabled
      await updateReminderSettings({
        reminder_days: 7,
        admin_mobile: '0917 555 0142',
        notification_channel: 'SMS',
        notify_customer_sms: true,
      });

      // Seed 3 sales that have been unpaid for 8 days (threshold: 7 days)
      const sales: SaleTransactionDTO[] = [
        createMockOverdueSale({
          id: 'sale-1',
          receiptNumber: 'ARLQ-02001',
          balance: 450,
          daysAgo: 8,
          asOfDate,
        }),
        createMockOverdueSale({
          id: 'sale-2',
          receiptNumber: 'ARLQ-02002',
          balance: 820,
          daysAgo: 9,
          asOfDate,
        }),
        createMockOverdueSale({
          id: 'sale-3',
          receiptNumber: 'ARLQ-02003',
          balance: 1250,
          daysAgo: 10,
          asOfDate,
        }),
      ];
      _setInMemorySales(sales);

      // Execute authorized GET request on route handler
      const request = new Request('http://localhost:3000/api/cron/overdue-sms-sweep', {
        method: 'GET',
        headers: { authorization: `Bearer ${TEST_SECRET}` },
      });

      const response = await GET(request);
      assert.equal(response.status, 200);

      const json = await response.json();
      assert.equal(json.success, true);
      assert.ok(json.timestamp);

      const summary = json.summary as CronSweepSummary;
      assert.equal(summary.salesEvaluated, 3);
      assert.equal(summary.eligibleOverdue, 3);
      assert.equal(summary.cooldownSuppressed, 0);
      assert.equal(summary.adminSmsDispatched, 3);
      assert.equal(summary.customerSmsDispatched, 3);
      assert.equal(summary.customerSmsSkipped, 0);
      assert.equal(summary.errors, 0);

      // Verify that last_sms_sent_at on each of the 3 sales is updated to the current timestamp
      const updatedSales = _getInMemorySales();
      for (const sale of updatedSales) {
        assert.ok(sale.last_sms_sent_at, `Sale ${sale.id} should have last_sms_sent_at set`);
      }
    });

    it('executes identically via POST method for manual webhook invocation', async () => {
      const asOfDate = new Date('2026-11-18T00:00:00Z');
      const sales = [
        createMockOverdueSale({
          id: 'sale-post-1',
          receiptNumber: 'ARLQ-02004',
          balance: 600,
          daysAgo: 8,
          asOfDate,
        }),
      ];
      _setInMemorySales(sales);

      const request = new Request('http://localhost:3000/api/cron/overdue-sms-sweep', {
        method: 'POST',
        headers: { authorization: `Bearer ${TEST_SECRET}` },
      });

      const response = await POST(request);
      assert.equal(response.status, 200);
      const json = await response.json();
      assert.equal(json.success, true);
      assert.equal(json.summary.adminSmsDispatched, 1);
    });
  });

  describe('Scenario 2: Unauthorized request is rejected immediately', () => {
    it('returns HTTP 401, does not evaluate sales, and sends zero SMS', async () => {
      const sales = [
        createMockOverdueSale({
          id: 'sale-unauth',
          receiptNumber: 'ARLQ-02005',
          balance: 999,
          daysAgo: 12,
        }),
      ];
      _setInMemorySales(sales);

      const request = new Request('http://localhost:3000/api/cron/overdue-sms-sweep', {
        method: 'GET',
        headers: { authorization: 'Bearer invalid_or_missing_secret' },
      });

      const response = await GET(request);
      assert.equal(response.status, 401);

      // Verify zero SMS were dispatched
      const history = _getDispatchedSmsHistory();
      assert.equal(history.length, 0);

      // Verify sale last_sms_sent_at was not touched
      const salesAfter = _getInMemorySales();
      assert.equal(salesAfter[0].last_sms_sent_at, null);
    });
  });

  describe('Scenario 3: 24-hour cooldown prevents duplicate daily spamming', () => {
    it('suppresses sale reminded 6 hours ago and logs SKIPPED in audit ledger', async () => {
      const asOfDate = new Date('2026-11-18T08:00:00Z');
      const sixHoursAgo = new Date(asOfDate.getTime() - 6 * 60 * 60 * 1000).toISOString();

      const sales = [
        createMockOverdueSale({
          id: 'sale-cooldown',
          receiptNumber: 'ARLQ-02006',
          balance: 750,
          daysAgo: 10,
          lastSmsSentAt: sixHoursAgo,
          asOfDate,
        }),
      ];
      _setInMemorySales(sales);

      const summary = await executeOverdueSmsSweep({ asOfDate, throttleMs: 0 });

      assert.equal(summary.salesEvaluated, 1);
      assert.equal(summary.eligibleOverdue, 1);
      assert.equal(summary.cooldownSuppressed, 1);
      assert.equal(summary.adminSmsDispatched, 0);
      assert.equal(summary.customerSmsDispatched, 0);

      // Verify audit log has SKIPPED status with cooldown reason
      const auditLogs = _getInMemorySmsAuditLogs();
      const cooldownLog = auditLogs.find(
        (log) => log.saleId === 'sale-cooldown' && log.status === 'SKIPPED'
      );
      assert.ok(cooldownLog, 'Should record a SKIPPED audit entry for cooldown sale');
      assert.match(cooldownLog.errorReason || '', /Dispatched within last 24h cooldown/);
    });
  });

  describe('Scenario 4: Customer SMS toggle disabled in System Settings', () => {
    it('dispatches admin operational alert but skips customer SMS and records audit entry', async () => {
      const asOfDate = new Date('2026-11-18T08:00:00Z');

      await updateReminderSettings({
        reminder_days: 7,
        admin_mobile: '0917 555 0142',
        notification_channel: 'SMS',
        notify_customer_sms: false, // Explicitly disabled
      });

      const sales = [
        createMockOverdueSale({
          id: 'sale-admin-only',
          receiptNumber: 'ARLQ-02007',
          balance: 550,
          daysAgo: 8,
          asOfDate,
        }),
      ];
      _setInMemorySales(sales);

      const summary = await executeOverdueSmsSweep({ asOfDate, throttleMs: 0 });

      assert.equal(summary.adminSmsDispatched, 1);
      assert.equal(summary.customerSmsDispatched, 0);
      assert.equal(summary.customerSmsSkipped, 1);

      // Check audit log contains "Customer notification disabled in settings"
      const auditLogs = _getInMemorySmsAuditLogs();
      const skippedCustomerLog = auditLogs.find(
        (l) => l.recipientType === 'CUSTOMER' && l.status === 'SKIPPED'
      );
      assert.ok(skippedCustomerLog, 'Audit log should record skipped customer notification');
      assert.match(skippedCustomerLog.errorReason || '', /Customer notification disabled in settings/);
    });
  });

  describe('Scenario 5: Resilience when external TextBee gateway fails during batch sweep', () => {
    it('isolates failure on 3rd sale, continues sweep, and reports errors: 1', async () => {
      const asOfDate = new Date('2026-11-18T08:00:00Z');

      await updateReminderSettings({
        reminder_days: 7,
        admin_mobile: '0917 555 0142',
        notify_customer_sms: false,
      });

      // 5 eligible overdue sales
      const sales: SaleTransactionDTO[] = [
        createMockOverdueSale({ id: 's1', receiptNumber: 'ARLQ-101', balance: 100, daysAgo: 8, asOfDate }),
        createMockOverdueSale({ id: 's2', receiptNumber: 'ARLQ-102', balance: 200, daysAgo: 8, asOfDate }),
        createMockOverdueSale({ id: 's3', receiptNumber: 'ARLQ-103', balance: 300, daysAgo: 8, asOfDate }),
        createMockOverdueSale({ id: 's4', receiptNumber: 'ARLQ-104', balance: 400, daysAgo: 8, asOfDate }),
        createMockOverdueSale({ id: 's5', receiptNumber: 'ARLQ-105', balance: 500, daysAgo: 8, asOfDate }),
      ];
      _setInMemorySales(sales);

      // Mock fetch so that the 3rd sale dispatch triggers a gateway error (503 / timeout)
      const originalFetch = globalThis.fetch;
      process.env.TEXTBEE_MOCK_DISPATCH = 'false';
      process.env.TEXTBEE_API_KEY = 'test-token';
      process.env.TEXTBEE_DEVICE_ID = 'test-device';

      globalThis.fetch = async (_url, init) => {
        const bodyStr = init?.body ? String(init.body) : '';
        if (bodyStr.includes('ARLQ-103')) {
          return new Response(JSON.stringify({ status: 'error', message: 'Carrier timeout' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(
          JSON.stringify({
            data: { id: `tb_${Date.now()}` },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      };

      try {
        const summary = await executeOverdueSmsSweep({ asOfDate, throttleMs: 0 });

        assert.equal(summary.salesEvaluated, 5);
        assert.equal(summary.eligibleOverdue, 5);
        assert.equal(summary.errors, 1, 'Error on 3rd sale should increment errors to 1');
        assert.equal(summary.adminSmsDispatched, 4, 'Remaining 4 sales should be successfully dispatched');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
