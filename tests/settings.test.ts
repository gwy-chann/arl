import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  reminderSettingsSchema,
  batchStockMinimumsSchema,
  changePasswordSchema,
} from '../lib/settings/settings-contracts.ts';
import {
  getSystemSettings,
  updateReminderSettings,
  getStockMinimumsMatrix,
  updateBatchStockMinimums,
  calculateIsOverdue,
  formatReminderSampleMessage,
  _resetSettingsStore,
} from '../lib/settings/settings-service.ts';

describe('Feature ARL-21: System Settings & Admin Security', () => {
  beforeEach(() => {
    _resetSettingsStore();
  });

  describe('Scenario 1: Update overdue reminder threshold days', () => {
    test('default reminder threshold is 7 days and admin mobile is set', async () => {
      const settings = await getSystemSettings();
      assert.equal(settings.reminder_days, 7);
      assert.equal(settings.admin_mobile, '0917 555 0142');
      assert.equal(settings.notification_channel, 'SMS');
    });

    test('updates reminder threshold from 7 days to 5 days', async () => {
      const updated = await updateReminderSettings({
        reminder_days: 5,
        admin_mobile: '0917 555 0142',
        notification_channel: 'SMS',
      });

      assert.equal(updated.reminder_days, 5);

      const retrieved = await getSystemSettings();
      assert.equal(retrieved.reminder_days, 5);
    });

    test('sales older than 5 days update to Overdue status when threshold is changed to 5 days', () => {
      const now = new Date('2026-11-05T12:00:00.000Z');
      const sixDaysAgo = new Date('2026-10-30T12:00:00.000Z');
      const fourDaysAgo = new Date('2026-11-01T12:00:00.000Z');

      const saleOldUnpaid = {
        total_amount: 1340.0,
        amount_paid: 0.0,
        created_at: sixDaysAgo,
      };

      const saleRecentUnpaid = {
        total_amount: 500.0,
        amount_paid: 200.0,
        created_at: fourDaysAgo,
      };

      const saleOldPaid = {
        total_amount: 1000.0,
        amount_paid: 1000.0,
        created_at: sixDaysAgo,
      };

      // Under original 7-day threshold:
      assert.equal(calculateIsOverdue(saleOldUnpaid, 7, now), false);

      // Under updated 5-day threshold:
      assert.equal(calculateIsOverdue(saleOldUnpaid, 5, now), true);
      assert.equal(calculateIsOverdue(saleRecentUnpaid, 5, now), false);
      assert.equal(calculateIsOverdue(saleOldPaid, 5, now), false);
    });

    test('generates dynamic sample reminder message matching mockup text', () => {
      const msg = formatReminderSampleMessage(
        'Aling Nena’s Sari-Sari Store',
        1340.0,
        'ARLQ-01058',
        5
      );

      assert.equal(
        msg,
        'ARLQ: Aling Nena’s Sari-Sari Store still owes ₱1,340.00 for receipt ARLQ-01058. Unpaid for 5 days. Reminders stop once the sale is marked Paid.'
      );
    });

    test('reminderSettingsSchema rejects threshold less than 1 or empty mobile', () => {
      const invalidThreshold = reminderSettingsSchema.safeParse({
        reminder_days: 0,
        admin_mobile: '0917 555 0142',
        notification_channel: 'SMS',
      });
      assert.equal(invalidThreshold.success, false);

      const invalidMobile = reminderSettingsSchema.safeParse({
        reminder_days: 5,
        admin_mobile: '   ',
        notification_channel: 'SMS',
      });
      assert.equal(invalidMobile.success, false);
    });
  });

  describe('Scenario 2: Batch minimum stock thresholds update', () => {
    test('retrieves the 3x3 matrix for Toyo, Suka, and Patis with 9 variants', async () => {
      const matrix = await getStockMinimumsMatrix();
      assert.equal(matrix.length, 3);

      const toyo = matrix.find((p) => p.product_name === 'Toyo');
      assert.ok(toyo);
      assert.ok(toyo.variants['350']);
      assert.ok(toyo.variants['1L']);
      assert.ok(toyo.variants['gal']);
      assert.equal(toyo.variants['350'].min_stock_level, 48);
    });

    test('batch updates all 9 variant minimum stock values and recalculates low stock', async () => {
      const batchPayload = [
        { variant_id: 'toyo-350', min_stock_level: 100 }, // stock 96 <= 100 => low stock!
        { variant_id: 'toyo-1L', min_stock_level: 25 },   // stock 58 > 25 => not low stock
        { variant_id: 'toyo-gal', min_stock_level: 10 },
        { variant_id: 'suka-350', min_stock_level: 50 },
        { variant_id: 'suka-1L', min_stock_level: 20 },
        { variant_id: 'suka-gal', min_stock_level: 5 },
        { variant_id: 'patis-350', min_stock_level: 30 },
        { variant_id: 'patis-1L', min_stock_level: 20 },
        { variant_id: 'patis-gal', min_stock_level: 10 },
      ];

      const success = await updateBatchStockMinimums(batchPayload);
      assert.equal(success, true);

      const matrix = await getStockMinimumsMatrix();
      const toyo = matrix.find((p) => p.product_name === 'Toyo')!;
      assert.equal(toyo.variants['350'].min_stock_level, 100);
      assert.equal(toyo.variants['350'].is_low_stock, true);

      assert.equal(toyo.variants['1L'].min_stock_level, 25);
      assert.equal(toyo.variants['1L'].is_low_stock, false);
    });

    test('batchStockMinimumsSchema rejects negative minimum stock levels', () => {
      const invalid = batchStockMinimumsSchema.safeParse({
        items: [
          { variant_id: 'toyo-350', min_stock_level: -5 },
        ],
      });
      assert.equal(invalid.success, false);
    });
  });

  describe('Scenario 3: Change password validation', () => {
    test('rejects new password shorter than 8 characters', () => {
      const result = changePasswordSchema.safeParse({
        current_password: 'oldPassword123',
        new_password: 'short',
        confirm_password: 'short',
      });

      assert.equal(result.success, false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path.includes('new_password'));
        assert.ok(error);
        assert.match(error.message, /at least 8 characters/);
      }
    });

    test('rejects when new password does not match confirmation password with exact toast text', () => {
      const result = changePasswordSchema.safeParse({
        current_password: 'oldPassword123',
        new_password: 'newPassword1234',
        confirm_password: 'differentPassword1234',
      });

      assert.equal(result.success, false);
      if (!result.success) {
        const error = result.error.issues.find((i) => i.path.includes('confirm_password'));
        assert.ok(error);
        assert.equal(error.message, 'New passwords do not match');
      }
    });
  });

  describe('Scenario 4: Successful password validation', () => {
    test('validates matching new password >= 8 characters', () => {
      const result = changePasswordSchema.safeParse({
        current_password: 'oldPassword123',
        new_password: 'superSecretPassword2026',
        confirm_password: 'superSecretPassword2026',
      });

      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.new_password, 'superSecretPassword2026');
      }
    });
  });
});
