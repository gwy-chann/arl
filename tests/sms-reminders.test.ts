import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAndNormalizePhilippineMobile,
  isEligibleForAutomatedReminder,
  dispatchOverdueBalanceReminders,
  sendManualCustomerSmsNudge,
  _resetSmsHistory,
  _getDispatchedSmsHistory,
} from '../lib/services/sms-service.ts';
import {
  formatAdminReminderMessage,
  formatCustomerReminderMessage,
  philippineMobileSchema,
} from '../lib/services/sms-contracts.ts';
import {
  getSystemSettings,
  updateReminderSettings,
  _resetSettingsStore,
  formatCustomerReminderSampleMessage,
} from '../lib/settings/settings-service.ts';
import {
  SaleService,
  resetInMemorySales,
  isSaleOverdue,
} from '../lib/sales/sale-service.ts';
import { resetMemoryCustomerStore } from '../lib/customers/customer-service.ts';

describe('Feature ARL-22: Dual SMS Overdue Balance Reminders for Admin & Customer', () => {
  beforeEach(() => {
    _resetSmsHistory();
    _resetSettingsStore();
    resetInMemorySales();
    resetMemoryCustomerStore();
  });

  describe('Philippine Mobile Number Validation & Normalization', () => {
    it('accepts valid 11-digit mobile numbers starting with 09', () => {
      const res = validateAndNormalizePhilippineMobile('0917 555 0142');
      assert.equal(res.isValid, true);
      assert.equal(res.clean, '09175550142');
      assert.equal(res.display, '0917 555 0142');
      assert.equal(res.e164, '+639175550142');
    });

    it('accepts valid international format starting with +639', () => {
      const res = validateAndNormalizePhilippineMobile('+63 918 123 4567');
      assert.equal(res.isValid, true);
      assert.equal(res.clean, '09181234567');
      assert.equal(res.display, '0918 123 4567');
      assert.equal(res.e164, '+639181234567');
    });

    it('rejects numbers missing Philippine mobile prefixes or invalid lengths', () => {
      assert.equal(validateAndNormalizePhilippineMobile('12345').isValid, false);
      assert.equal(validateAndNormalizePhilippineMobile('08123456789').isValid, false);
      assert.equal(validateAndNormalizePhilippineMobile('+14155552671').isValid, false);
      assert.equal(validateAndNormalizePhilippineMobile('').isValid, false);
      assert.equal(validateAndNormalizePhilippineMobile(null).isValid, false);
    });

    it('validates via Zod philippineMobileSchema', () => {
      assert.doesNotThrow(() => philippineMobileSchema.parse('0917 555 0142'));
      assert.throws(() => philippineMobileSchema.parse('invalid-phone'));
    });
  });

  describe('Message Formatting Invariants', () => {
    it('generates exact Admin Operational SMS template copy', () => {
      const msg = formatAdminReminderMessage({
        customerName: "Aling Nena's Sari-Sari Store",
        balanceFormatted: '₱1,340.00',
        receiptNumber: 'ARLQ-01058',
        daysUnpaid: 10,
        reminderDays: 7,
      });

      assert.equal(
        msg,
        "ARLQ Alert: Aling Nena's Sari-Sari Store still owes ₱1,340.00 for receipt ARLQ-01058. Unpaid for 10 days (limit: 7 days). Reminders stop once marked Paid."
      );
    });

    it('generates exact Customer Courteous SMS template copy', () => {
      const msg = formatCustomerReminderMessage({
        customerName: "Aling Nena's Sari-Sari Store",
        balanceFormatted: '₱1,340.00',
        receiptNumber: 'ARLQ-01058',
        reminderDays: 7,
      });

      assert.equal(
        msg,
        "ARLQ Condiments: Good day, Aling Nena's Sari-Sari Store! Friendly reminder that receipt ARLQ-01058 has an outstanding balance of ₱1,340.00 (due after 7 days). Kindly settle at your earliest convenience. Thank you for your continued business!"
      );
    });

    it('formats customer sample preview message in settings service', () => {
      const sample = formatCustomerReminderSampleMessage(
        "Aling Nena's Sari-Sari Store",
        1340,
        'ARLQ-01058',
        7
      );
      assert.match(sample, /ARLQ Condiments: Good day/);
      assert.match(sample, /₱1,340.00/);
      assert.match(sample, /due after 7 days/);
    });
  });

  describe('24-Hour Cooldown & Rate Limiting', () => {
    it('allows dispatch when last_sms_sent_at is null or empty', () => {
      assert.equal(isEligibleForAutomatedReminder(null), true);
      assert.equal(isEligibleForAutomatedReminder(undefined), true);
    });

    it('blocks dispatch when last_sms_sent_at is within 24 hours', () => {
      const now = new Date('2026-11-14T12:00:00Z');
      const recent = new Date('2026-11-14T02:00:00Z').toISOString(); // 10 hours ago
      assert.equal(isEligibleForAutomatedReminder(recent, now), false);
    });

    it('permits dispatch when last_sms_sent_at is 24 hours or older', () => {
      const now = new Date('2026-11-14T12:00:00Z');
      const old = new Date('2026-11-13T11:00:00Z').toISOString(); // 25 hours ago
      assert.equal(isEligibleForAutomatedReminder(old, now), true);
    });
  });

  describe('Scenario 1: Automated Dual SMS Dispatch on Overdue Threshold', () => {
    it('dispatches both admin and customer SMS when customer toggle is enabled and phone is valid', async () => {
      // 1. Enable customer SMS in settings
      await updateReminderSettings({
        reminder_days: 7,
        admin_mobile: '0917 555 0142',
        notification_channel: 'SMS',
        notify_customer_sms: true,
      });

      // Reference date: 16 days after 2026-10-25 sales creation
      const asOfDate = new Date('2026-11-10T00:00:00Z');

      const sweep = await dispatchOverdueBalanceReminders({ asOfDate });

      assert.ok(sweep.salesEvaluated > 0);
      assert.ok(sweep.adminSmsDispatched > 0, 'Admin SMS should be dispatched for overdue sales');
      assert.ok(sweep.customerSmsDispatched > 0, 'Customer SMS should be dispatched when enabled');

      const history = _getDispatchedSmsHistory();
      const adminDispatches = history.filter((h) => h.recipientType === 'ADMIN');
      const customerDispatches = history.filter((h) => h.recipientType === 'CUSTOMER');

      assert.ok(adminDispatches.length > 0);
      assert.ok(customerDispatches.length > 0);
      assert.equal(adminDispatches[0].recipientMobile, '0917 555 0142');
      assert.match(customerDispatches[0].message, /ARLQ Condiments: Good day/);
    });

    it('dispatches ONLY admin SMS when customer toggle is disabled (opt-out safety)', async () => {
      // Customer toggle is false by default
      const settings = await getSystemSettings();
      assert.equal(settings.notify_customer_sms, false);

      const asOfDate = new Date('2026-11-10T00:00:00Z');
      const sweep = await dispatchOverdueBalanceReminders({ asOfDate });

      assert.ok(sweep.adminSmsDispatched > 0);
      assert.equal(sweep.customerSmsDispatched, 0, 'Zero customer SMS when toggle is disabled');

      const history = _getDispatchedSmsHistory();
      const customerDispatches = history.filter((h) => h.recipientType === 'CUSTOMER');
      assert.equal(customerDispatches.length, 0);
    });
  });

  describe('Scenario 2: Graceful Degradation When Customer Has No Mobile Number', () => {
    it('dispatches admin SMS normally and skips customer SMS with audit note when phone is missing/invalid', async () => {
      await updateReminderSettings({
        reminder_days: 7,
        admin_mobile: '0917 555 0142',
        notification_channel: 'SMS',
        notify_customer_sms: true,
      });

      // Update customer k1 to have an invalid phone
      const { updateCustomer } = await import('../lib/customers/customer-service.ts');
      await updateCustomer('k1', {
        name: "Aling Nena's Sari-Sari Store",
        phone: 'invalid-phone',
        address: 'Purok 3',
      });

      const asOfDate = new Date('2026-11-10T00:00:00Z');
      const sweep = await dispatchOverdueBalanceReminders({ asOfDate });

      // Admin SMS is still sent
      assert.ok(sweep.adminSmsDispatched > 0);
      assert.ok(sweep.customerSmsSkipped > 0, 'Should increment customerSmsSkipped count');

      const skippedRecord = sweep.dispatches.find(
        (d) => d.recipientType === 'CUSTOMER' && d.error?.includes('Customer SMS skipped')
      );
      assert.ok(skippedRecord, 'Should log audit record for skipped customer SMS');
    });
  });

  describe('Scenario 3: Customer SMS Toggle in Settings (/settings/reminders)', () => {
    it('persists notify_customer_sms toggle in system settings store', async () => {
      const initial = await getSystemSettings();
      assert.equal(initial.notify_customer_sms, false);

      const updated = await updateReminderSettings({
        reminder_days: 5,
        admin_mobile: '0919 888 7766',
        notification_channel: 'SMS',
        notify_customer_sms: true,
      });

      assert.equal(updated.notify_customer_sms, true);
      assert.equal(updated.reminder_days, 5);
      assert.equal(updated.admin_mobile, '0919 888 7766');

      const reFetched = await getSystemSettings();
      assert.equal(reFetched.notify_customer_sms, true);
    });
  });

  describe('Scenario 4: Manual Customer SMS Nudge from Utang Tracker (/customers/balances)', () => {
    it('sends an on-demand SMS reminder directly to the customer phone using customerId', async () => {
      const result = await sendManualCustomerSmsNudge({
        customerId: 'k1', // Aling Nena
      });

      assert.equal(result.success, true);
      assert.match(result.message || '', /SMS reminder sent to Aling Nena['’]s Sari-Sari Store/);
      assert.equal(result.dispatchedTo, '0917 301 4488');

      const history = _getDispatchedSmsHistory();
      assert.equal(history.length, 1);
      assert.equal(history[0].recipientType, 'CUSTOMER');
      assert.match(history[0].message, /Good day, Aling Nena['’]s Sari-Sari Store/);
    });

    it('fails gracefully when customer has no valid phone number', async () => {
      // Update customer k4 with invalid phone
      const { updateCustomer } = await import('../lib/customers/customer-service.ts');
      await updateCustomer('k4', {
        name: 'Kristine Dela Cruz',
        phone: '1234567', // invalid Philippine mobile prefix
        address: 'Lot 8, Mabini Subdivision',
      });

      const result = await sendManualCustomerSmsNudge({
        customerId: 'k4',
      });

      assert.equal(result.success, false);
      assert.match(result.error || '', /no valid mobile number/);
    });
  });

  describe('Scenario 5: Manual Customer SMS Nudge from Sale Invoice (/sales/[id])', () => {
    it('dispatches reminder by saleId and updates sale last_sms_sent_at', async () => {
      const saleService = new SaleService();
      const sales = await saleService.getSales();
      const targetSale = sales.find((s) => s.balance > 0 && s.customer_phone);
      assert.ok(targetSale);

      const result = await sendManualCustomerSmsNudge({
        saleId: targetSale.id,
      });

      assert.equal(result.success, true);
      assert.ok(result.lastSmsSentAt);

      // Verify sale record updated
      const updatedSale = await saleService.getSaleById(targetSale.id);
      assert.ok(updatedSale?.last_sms_sent_at);
      assert.equal(updatedSale.last_sms_sent_at, result.lastSmsSentAt);
    });
  });

  describe('Scenario 6: Immediate Deactivation upon Payment Settlement', () => {
    it('ceases automated reminders when balance is settled to 0 and status transitions to Paid', async () => {
      await updateReminderSettings({
        reminder_days: 7,
        admin_mobile: '0917 555 0142',
        notification_channel: 'SMS',
        notify_customer_sms: true,
      });

      const saleService = new SaleService();
      const sales = await saleService.getSales();
      const targetSale = sales.find((s) => s.balance > 0);
      assert.ok(targetSale);

      // Settle payment in full
      const updateResult = await saleService.updateSalePayment(
        targetSale.id,
        'Paid',
        targetSale.total_amount
      );
      assert.equal(updateResult.success, true);
      assert.equal(updateResult.sale?.balance, 0);
      assert.equal(updateResult.sale?.payment_status, 'Paid');

      // Verify isSaleOverdue returns false
      assert.equal(isSaleOverdue(0, targetSale.created_at, 7), false);

      _resetSmsHistory();

      // Run automated sweep
      const asOfDate = new Date('2026-11-14T00:00:00Z');
      const sweep = await dispatchOverdueBalanceReminders({ asOfDate });

      // Verify targetSale was not dispatched
      const dispatchesForTarget = sweep.dispatches.filter(
        (d) => 'saleId' in d && (d as { saleId?: string }).saleId === targetSale.id
      );
      assert.equal(dispatchesForTarget.length, 0, 'Settled sale should not trigger reminders');
    });
  });
});
