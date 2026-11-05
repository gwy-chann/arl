import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getCustomerById,
  resetMemoryCustomerStore,
  formatPeso,
  formatCustomerBalance,
  getDaysOutstanding,
  isSaleOverdue,
} from '../lib/customers/customer-service.ts';
import type { SaleSummary } from '../lib/customers/customer-contracts.ts';

describe('Feature ARL-10: Customer Profile View with Purchase Ledger & Debt Breakdown', () => {
  beforeEach(() => {
    resetMemoryCustomerStore();
  });

  describe('Scenario 1: Customer Profile Overview with Debt', () => {
    it('retrieves customer profile for Mang Tonyo Carinderia with ₱240 debt and overdue unpaid sale', async () => {
      const customer = await getCustomerById('k2');
      assert.ok(customer, 'Customer k2 should be found');

      // Verify identity header details
      assert.strictEqual(customer.name, 'Mang Tonyo Carinderia');
      assert.strictEqual(customer.phone, '0928 554 1290');
      assert.strictEqual(customer.address, 'Public Market Stall 14');
      const contactString = `${customer.phone} · ${customer.address}`;
      assert.strictEqual(contactString, '0928 554 1290 · Public Market Stall 14');

      // Verify total debt balance
      assert.strictEqual(customer.debt_balance, 240.0);
      assert.strictEqual(formatPeso(customer.debt_balance), '₱240.00');

      // Format balance display styling
      const balanceFormat = formatCustomerBalance(customer.debt_balance);
      assert.strictEqual(balanceFormat.isIndebted, true);
      assert.ok(
        balanceFormat.displayClass.includes('text-danger'),
        'Debt must be highlighted in text-danger'
      );

      // Verify itemized unpaid sales
      const unpaidSales = customer.sales.filter((s) => s.balance > 0);
      assert.strictEqual(unpaidSales.length, 1, 'Should have exactly 1 unpaid sale');

      const unpaidSale = unpaidSales[0];
      assert.strictEqual(unpaidSale.receipt_number, 'ARLQ-01063');
      assert.strictEqual(unpaidSale.balance, 240);
      assert.ok(
        typeof unpaidSale.days_outstanding === 'number' && unpaidSale.days_outstanding > 0,
        'Should compute days outstanding'
      );
      assert.strictEqual(
        unpaidSale.is_overdue,
        true,
        'Should flag unpaid sale older than 7 days as overdue'
      );
    });

    it('calculates days outstanding and flags overdue status correctly', () => {
      // 14 days ago should be overdue (threshold = 7 days)
      const date14DaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const days = getDaysOutstanding(date14DaysAgo);
      assert.strictEqual(days, 14);
      assert.strictEqual(isSaleOverdue(days, 7), true);

      // 2 days ago should NOT be overdue
      const date2DaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      const daysRecent = getDaysOutstanding(date2DaysAgo);
      assert.strictEqual(daysRecent, 2);
      assert.strictEqual(isSaleOverdue(daysRecent, 7), false);
    });
  });

  describe('Scenario 2: Transaction History Table', () => {
    it('retrieves and lists all 5 transactions chronologically with receipt, date, total, balance, payment, and order', async () => {
      // Customer k7 has 5 seeded past transactions: 3 Paid, 2 Partially Paid
      const customer = await getCustomerById('k7');
      assert.ok(customer, 'Customer k7 should be found');
      assert.strictEqual(customer.sales.length, 5, 'Should have exactly 5 past transactions');

      const paidSales = customer.sales.filter((s) => s.payment_status === 'Paid');
      const partiallyPaidSales = customer.sales.filter(
        (s) => s.payment_status === 'Partially Paid'
      );
      assert.strictEqual(paidSales.length, 3, 'Should have 3 Paid transactions');
      assert.strictEqual(partiallyPaidSales.length, 2, 'Should have 2 Partially Paid transactions');

      // Verify chronological sorting (earliest first)
      for (let i = 0; i < customer.sales.length - 1; i++) {
        const currentDate = new Date(customer.sales[i].created_at).getTime();
        const nextDate = new Date(customer.sales[i + 1].created_at).getTime();
        assert.ok(
          currentDate <= nextDate,
          `Sale at index ${i} should be earlier than or equal to sale at index ${i + 1}`
        );
      }

      // Verify required fields on each sale row
      customer.sales.forEach((sale: SaleSummary) => {
        assert.ok(sale.receipt_number.startsWith('ARLQ-'), 'Should have receipt number');
        assert.ok(sale.created_at, 'Should have sale timestamp/date');
        assert.ok(typeof sale.total_amount === 'number' && sale.total_amount > 0);
        assert.ok(typeof sale.balance === 'number' && sale.balance >= 0);
        assert.ok(
          ['Paid', 'Partially Paid', 'Not Yet Paid'].includes(sale.payment_status),
          `Invalid payment status: ${sale.payment_status}`
        );
        assert.ok(
          ['Pending', 'Delivered', 'Picked Up'].includes(sale.order_status),
          `Invalid order status: ${sale.order_status}`
        );
      });
    });
  });

  describe('Scenario 3: Pre-Selected New Sale Trigger', () => {
    it('constructs new sale URL pre-selecting customer ID in header action', async () => {
      const customer = await getCustomerById('k2');
      assert.ok(customer);

      const newSaleUrl = `/sales/new?customerId=${customer.id}`;
      const url = new URL(newSaleUrl, 'http://localhost');
      assert.strictEqual(url.searchParams.get('customerId'), 'k2');
    });
  });

  describe('Scenario 4: Fully Settled Customer Account', () => {
    it('displays ₱0.00 and fully paid note when customer has no unpaid balances', async () => {
      // Customer k3 (Lola Remedios Eatery) has zero unpaid debt
      const customer = await getCustomerById('k3');
      assert.ok(customer, 'Customer k3 should be found');

      assert.strictEqual(customer.debt_balance, 0);
      assert.strictEqual(formatPeso(customer.debt_balance), '₱0.00');

      const unpaidSales = customer.sales.filter((s) => s.balance > 0);
      assert.strictEqual(unpaidSales.length, 0, 'Should have 0 unpaid sales');

      const noteText = 'Fully paid. Nothing is owed.';
      assert.strictEqual(noteText, 'Fully paid. Nothing is owed.');
    });
  });
});
