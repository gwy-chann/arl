import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  SaleService,
  resetInMemorySales,
  getDaysUnpaid,
  isSaleOverdue,
  getOverdueDays,
  formatOverdueBannerNotice,
} from '../lib/sales/sale-service.ts';
import {
  resetMemoryCustomerStore,
  getCustomerById,
} from '../lib/customers/customer-service.ts';
import { getSystemSettings } from '../lib/settings/settings-service.ts';

describe('Feature ARL-15: Sales Transaction Ledger, Detail View & Status Manager', () => {
  beforeEach(() => {
    resetMemoryCustomerStore();
    resetInMemorySales();
  });

  describe('Scenario 1: Sales ledger search and status filtering', () => {
    it('retrieves sales transactions and filters by payment status', async () => {
      const saleService = new SaleService(null);
      const allSales = await saleService.getSales();
      assert.ok(allSales.length >= 3, 'Should have at least 3 initial sales');

      // Filter: Not Yet Paid
      const unpaidSales = allSales.filter((s) => s.payment_status === 'Not Yet Paid');
      assert.ok(unpaidSales.length >= 1, 'Should have unpaid sales');
      assert.ok(
        unpaidSales.every((s) => s.payment_status === 'Not Yet Paid'),
        'All filtered sales should be Not Yet Paid'
      );

      // Filter: Paid
      const paidSales = allSales.filter((s) => s.payment_status === 'Paid');
      assert.ok(paidSales.length >= 1, 'Should have paid sales');
      assert.ok(
        paidSales.every((s) => s.payment_status === 'Paid'),
        'All filtered sales should be Paid'
      );

      // Filter: Partially Paid
      const partialSales = allSales.filter((s) => s.payment_status === 'Partially Paid');
      assert.ok(partialSales.length >= 1, 'Should have partially paid sales');
      assert.ok(
        partialSales.every((s) => s.payment_status === 'Partially Paid'),
        'All filtered sales should be Partially Paid'
      );
    });

    it('filters sales by receipt number and customer name search query', async () => {
      const saleService = new SaleService(null);
      const allSales = await saleService.getSales();

      // Search by receipt number
      const queryReceipt = '01063';
      const receiptMatches = allSales.filter(
        (s) =>
          s.receipt_number.toLowerCase().includes(queryReceipt.toLowerCase()) ||
          (s.customer_name || '').toLowerCase().includes(queryReceipt.toLowerCase())
      );
      assert.equal(receiptMatches.length, 1);
      assert.equal(receiptMatches[0].receipt_number, 'ARLQ-01063');

      // Search by customer name
      const queryName = 'Tonyo';
      const customerMatches = allSales.filter(
        (s) =>
          s.receipt_number.toLowerCase().includes(queryName.toLowerCase()) ||
          (s.customer_name || '').toLowerCase().includes(queryName.toLowerCase())
      );
      assert.equal(customerMatches.length, 1);
      assert.equal(customerMatches[0].customer_name, 'Mang Tonyo Carinderia');
    });

    it('each sale has a valid ID that can be retrieved for detail navigation', async () => {
      const saleService = new SaleService(null);
      const allSales = await saleService.getSales();
      const firstSale = allSales[0];

      const detail = await saleService.getSaleById(firstSale.id);
      assert.ok(detail, 'Sale detail must be retrievable by ID');
      assert.equal(detail.id, firstSale.id);
      assert.equal(detail.receipt_number, firstSale.receipt_number);
    });
  });

  describe('Scenario 2: Overdue sale alert banner', () => {
    it('detects a sale unpaid for 9 days with 7-day threshold and formats overdue alert banner', async () => {
      const saleService = new SaleService(null);
      const settings = await getSystemSettings();
      assert.equal(settings.reminder_days, 7);

      // Reference date: Nov 5, 2026
      const mockAsOf = new Date('2026-11-05T00:00:00Z');
      const createdAt9DaysAgo = new Date('2026-10-27T00:00:00Z').toISOString();

      const daysUnpaid = getDaysUnpaid(createdAt9DaysAgo, mockAsOf);
      assert.equal(daysUnpaid, 9, 'Should be unpaid for 9 days');

      const isOverdue = isSaleOverdue(1340, createdAt9DaysAgo, settings.reminder_days, mockAsOf);
      assert.equal(isOverdue, true, 'Sale must be flagged overdue');

      const overdueDays = getOverdueDays(createdAt9DaysAgo, settings.reminder_days, mockAsOf);
      assert.equal(overdueDays, 2, 'Must be overdue by 2 days past the reminder limit');

      const banner = formatOverdueBannerNotice({
        balance: 1340,
        createdAt: createdAt9DaysAgo,
        reminderDays: settings.reminder_days,
        adminMobile: settings.admin_mobile,
        asOfDate: mockAsOf,
      });

      assert.ok(banner);
      assert.equal(
        banner.title,
        'Overdue by 2 days past the reminder limit.'
      );
      assert.equal(
        banner.subtitle,
        `Unpaid for 9 days. An SMS reminder was sent to ${settings.admin_mobile}. It stops when you mark this sale as Paid.`
      );
    });

    it('correctly formats single-day overdue notice pluralization', () => {
      const mockAsOf = new Date('2026-11-05T00:00:00Z');
      const createdAt8DaysAgo = new Date('2026-10-28T00:00:00Z').toISOString();

      const banner = formatOverdueBannerNotice({
        balance: 500,
        createdAt: createdAt8DaysAgo,
        reminderDays: 7,
        adminMobile: '0917 555 0142',
        asOfDate: mockAsOf,
      });

      assert.ok(banner);
      assert.equal(banner.title, 'Overdue by 1 day past the reminder limit.');
      assert.equal(
        banner.subtitle,
        'Unpaid for 8 days. An SMS reminder was sent to 0917 555 0142. It stops when you mark this sale as Paid.'
      );
    });

    it('does not flag a sale as overdue if balance is 0 even if older than reminder limit', () => {
      const mockAsOf = new Date('2026-11-05T00:00:00Z');
      const createdAt20DaysAgo = new Date('2026-10-16T00:00:00Z').toISOString();

      const isOverdue = isSaleOverdue(0, createdAt20DaysAgo, 7, mockAsOf);
      assert.equal(isOverdue, false, 'Paid sales must never be flagged as overdue');

      const banner = formatOverdueBannerNotice({
        balance: 0,
        createdAt: createdAt20DaysAgo,
        reminderDays: 7,
        adminMobile: '0917 555 0142',
        asOfDate: mockAsOf,
      });
      assert.equal(banner, null, 'Banner must be null when balance is 0');
    });
  });

  describe('Scenario 3: Payment status update to fully paid', () => {
    it('updates unpaid sale of ₱1,340.00 to Paid, sets balance=0, dismisses overdue banner, and synchronizes customer debt', async () => {
      const saleService = new SaleService(null);
      const sale = await saleService.getSaleById('s2');
      assert.ok(sale, 'Seed sale ARLQ-01058 must exist');
      assert.equal(sale.total_amount, 1340);
      assert.equal(sale.balance, 1340);
      assert.equal(sale.payment_status, 'Not Yet Paid');

      // Check customer initial debt
      const customerBefore = await getCustomerById(sale.customer_id, null);
      assert.ok(customerBefore);
      const initialDebt = customerBefore.debt_balance;
      assert.ok(initialDebt >= 1340);

      // Perform update to "Paid"
      const updateResult = await saleService.updateSalePayment(sale.id, 'Paid');
      assert.ok(updateResult.success, 'Payment update must succeed');
      assert.ok(updateResult.sale);
      assert.equal(updateResult.sale.payment_status, 'Paid');
      assert.equal(updateResult.sale.amount_paid, 1340);
      assert.equal(updateResult.sale.balance, 0);

      // Verify overdue banner computation is now dismissed
      const isStillOverdue = isSaleOverdue(
        updateResult.sale.balance,
        updateResult.sale.created_at,
        7
      );
      assert.equal(isStillOverdue, false, 'Overdue banner must disappear');

      // Verify customer debt rollup decreased by 1340
      const customerAfter = await getCustomerById(sale.customer_id, null);
      assert.ok(customerAfter);
      assert.equal(customerAfter.debt_balance, initialDebt - 1340);
    });

    it('updates sale to Partially Paid and correctly calculates new balance', async () => {
      const saleService = new SaleService(null);
      const sale = await saleService.getSaleById('s2');
      assert.ok(sale);

      const updateResult = await saleService.updateSalePayment(sale.id, 'Partially Paid', 500);
      assert.ok(updateResult.success);
      assert.ok(updateResult.sale);
      assert.equal(updateResult.sale.payment_status, 'Partially Paid');
      assert.equal(updateResult.sale.amount_paid, 500);
      assert.equal(updateResult.sale.balance, 840);
    });

    it('rejects invalid partial payment amounts outside (0, totalAmount)', async () => {
      const saleService = new SaleService(null);
      const sale = await saleService.getSaleById('s2');
      assert.ok(sale);

      // Zero payment
      const resZero = await saleService.updateSalePayment(sale.id, 'Partially Paid', 0);
      assert.equal(resZero.success, false);
      assert.ok(resZero.error?.includes('Enter an amount between ₱1'));

      // Payment exceeding total
      const resExcess = await saleService.updateSalePayment(sale.id, 'Partially Paid', 1500);
      assert.equal(resExcess.success, false);
      assert.ok(resExcess.error?.includes('Enter an amount between ₱1'));

      // Negative payment
      const resNeg = await saleService.updateSalePayment(sale.id, 'Partially Paid', -10);
      assert.equal(resNeg.success, false);
    });
  });

  describe('Scenario 4: Order fulfillment state transition', () => {
    it('transitions order status from Pending to Delivered and Picked Up', async () => {
      const saleService = new SaleService(null);
      const sale = await saleService.getSaleById('s-seed-2');
      assert.ok(sale);
      assert.equal(sale.order_status, 'Pending');

      // Transition to Delivered
      const resDelivered = await saleService.updateSaleOrderStatus(sale.id, 'Delivered');
      assert.ok(resDelivered.success);
      assert.ok(resDelivered.sale);
      assert.equal(resDelivered.sale.order_status, 'Delivered');

      // Verify in-memory persistence
      const freshSale = await saleService.getSaleById(sale.id);
      assert.ok(freshSale);
      assert.equal(freshSale.order_status, 'Delivered');

      // Transition to Picked Up
      const resPickedUp = await saleService.updateSaleOrderStatus(sale.id, 'Picked Up');
      assert.ok(resPickedUp.success);
      assert.equal(resPickedUp.sale?.order_status, 'Picked Up');
    });
  });

  describe('Edge Cases & Resiliency', () => {
    it('returns error when updating a non-existent sale ID', async () => {
      const saleService = new SaleService(null);
      const resPay = await saleService.updateSalePayment('invalid-sale-id', 'Paid');
      assert.equal(resPay.success, false);
      assert.equal(resPay.error, 'Sale not found');

      const resOrder = await saleService.updateSaleOrderStatus('invalid-sale-id', 'Delivered');
      assert.equal(resOrder.success, false);
      assert.equal(resOrder.error, 'Sale not found');
    });

    it('retrieves sale by receipt number case-insensitively', async () => {
      const saleService = new SaleService(null);
      const byLower = await saleService.getSaleById('arlq-01041');
      assert.ok(byLower);
      assert.equal(byLower.receipt_number, 'ARLQ-01041');
    });
  });
});
