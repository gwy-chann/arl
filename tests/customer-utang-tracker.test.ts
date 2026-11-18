import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCustomerUtangSummary,
  getCustomerUtangSummary,
  resetMemoryCustomerStore,
  formatPeso,
} from '../lib/customers/customer-service.ts';
import type {
  CustomerWithRollup,
  SaleSummary,
} from '../lib/customers/customer-contracts.ts';

describe('Feature ARL-19: Customer Utang Tracker & Overdue Reminder Queue', () => {
  const fixedAsOf = new Date('2026-11-06T12:00:00.000Z');

  beforeEach(() => {
    resetMemoryCustomerStore();
  });

  describe('Scenario 1: Automatic debt age ranking', () => {
    it('automatically sorts debtor customers descending by the age of their oldest unpaid sale', () => {
      const customers: CustomerWithRollup[] = [
        {
          id: 'k1',
          name: "Aling Nena's Sari-Sari Store",
          phone: '0917 301 4488',
          address: 'Purok 3',
          purchase_count: 4,
          debt_balance: 1340,
          created_at: '2026-10-01T08:00:00Z',
          updated_at: '2026-10-01T08:00:00Z',
        },
        {
          id: 'k2',
          name: 'Mang Tonyo Carinderia',
          phone: '0928 554 1290',
          address: 'Public Market',
          purchase_count: 5,
          debt_balance: 240,
          created_at: '2026-10-02T08:00:00Z',
          updated_at: '2026-10-02T08:00:00Z',
        },
        {
          id: 'k7',
          name: 'Tito Boy Lechon Haus',
          phone: '0927 774 1156',
          address: 'Brgy. Santo Niño',
          purchase_count: 4,
          debt_balance: 300,
          created_at: '2026-10-07T08:00:00Z',
          updated_at: '2026-10-07T08:00:00Z',
        },
        {
          id: 'k8',
          name: "Jun-Jun's Turo-Turo",
          phone: '0998 120 6677',
          address: 'Corner Luna St.',
          purchase_count: 2,
          debt_balance: 200,
          created_at: '2026-10-08T08:00:00Z',
          updated_at: '2026-10-08T08:00:00Z',
        },
        {
          id: 'k3',
          name: 'Lola Remedios Eatery',
          phone: '0935 882 7013',
          address: 'Rizal St.',
          purchase_count: 3,
          debt_balance: 0,
          created_at: '2026-10-03T08:00:00Z',
          updated_at: '2026-10-03T08:00:00Z',
        },
      ];

      const sales: SaleSummary[] = [
        // k1: oldest unpaid is 10 days ago (2026-10-27)
        {
          id: 's2',
          receipt_number: 'ARLQ-01058',
          customer_id: 'k1',
          total_amount: 1340,
          amount_paid: 0,
          balance: 1340,
          payment_status: 'Not Yet Paid',
          order_status: 'Delivered',
          created_at: '2026-10-27T12:00:00.000Z',
        },
        // k2: oldest unpaid is 19 days ago (2026-10-18)
        {
          id: 's4',
          receipt_number: 'ARLQ-01063',
          customer_id: 'k2',
          total_amount: 560,
          amount_paid: 320,
          balance: 240,
          payment_status: 'Partially Paid',
          order_status: 'Pending',
          created_at: '2026-10-18T12:00:00.000Z',
        },
        // k7: oldest unpaid is 30 days ago (2026-10-07) and another 12 days ago (2026-10-25)
        {
          id: 's9',
          receipt_number: 'ARLQ-01052',
          customer_id: 'k7',
          total_amount: 600,
          amount_paid: 450,
          balance: 150,
          payment_status: 'Partially Paid',
          order_status: 'Pending',
          created_at: '2026-10-07T12:00:00.000Z',
        },
        {
          id: 's10',
          receipt_number: 'ARLQ-01059',
          customer_id: 'k7',
          total_amount: 450,
          amount_paid: 300,
          balance: 150,
          payment_status: 'Partially Paid',
          order_status: 'Delivered',
          created_at: '2026-10-25T12:00:00.000Z',
        },
        // k8: oldest unpaid is 3 days ago (2026-11-03)
        {
          id: 's11',
          receipt_number: 'ARLQ-01064',
          customer_id: 'k8',
          total_amount: 500,
          amount_paid: 300,
          balance: 200,
          payment_status: 'Partially Paid',
          order_status: 'Delivered',
          created_at: '2026-11-03T12:00:00.000Z',
        },
        // k3: fully paid
        {
          id: 's3',
          receipt_number: 'ARLQ-01045',
          customer_id: 'k3',
          total_amount: 300,
          amount_paid: 300,
          balance: 0,
          payment_status: 'Paid',
          order_status: 'Delivered',
          created_at: '2026-10-12T12:00:00.000Z',
        },
      ];

      const summary = calculateCustomerUtangSummary(customers, sales, {
        reminderDays: 7,
        adminMobile: '0917 555 0142',
        asOfDate: fixedAsOf,
      });

      // Assert debtors length (k3 with 0 balance should be excluded)
      assert.strictEqual(summary.rows.length, 4);

      // Verify descending order by age of oldest unpaid sale
      assert.strictEqual(summary.rows[0].customer_name, 'Tito Boy Lechon Haus');
      assert.strictEqual(summary.rows[0].days_outstanding, 30);
      assert.strictEqual(summary.rows[0].oldest_receipt_number, 'ARLQ-01052');
      assert.strictEqual(summary.rows[0].total_balance, 300);

      assert.strictEqual(summary.rows[1].customer_name, 'Mang Tonyo Carinderia');
      assert.strictEqual(summary.rows[1].days_outstanding, 19);
      assert.strictEqual(summary.rows[1].oldest_receipt_number, 'ARLQ-01063');
      assert.strictEqual(summary.rows[1].total_balance, 240);

      assert.strictEqual(summary.rows[2].customer_name, "Aling Nena's Sari-Sari Store");
      assert.strictEqual(summary.rows[2].days_outstanding, 10);
      assert.strictEqual(summary.rows[2].oldest_receipt_number, 'ARLQ-01058');
      assert.strictEqual(summary.rows[2].total_balance, 1340);

      assert.strictEqual(summary.rows[3].customer_name, "Jun-Jun's Turo-Turo");
      assert.strictEqual(summary.rows[3].days_outstanding, 3);
      assert.strictEqual(summary.rows[3].oldest_receipt_number, 'ARLQ-01064');
      assert.strictEqual(summary.rows[3].total_balance, 200);

      // Verify 3-column stats highlight
      assert.strictEqual(summary.total_owed, 2080);
      assert.strictEqual(formatPeso(summary.total_owed), '₱2,080.00');
      assert.strictEqual(summary.total_debtors, 4);

      // Overdue: Tito Boy (300) + Mang Tonyo (240) + Aling Nena (1340) = 1880
      assert.strictEqual(summary.overdue_owed, 1880);
      assert.strictEqual(formatPeso(summary.overdue_owed), '₱1,880.00');
      assert.strictEqual(summary.overdue_debtors, 3);

      assert.strictEqual(summary.reminder_days, 7);
      assert.strictEqual(summary.admin_mobile, '0917 555 0142');
    });
  });

  describe('Scenario 2: Overdue status badge flagging', () => {
    it('flags customer with oldest unpaid sale >= reminderDays (9 days >= 7) as Overdue in bad red', () => {
      const customers: CustomerWithRollup[] = [
        {
          id: 'k-overdue',
          name: 'Overdue Bakery',
          phone: '0911 222 3344',
          address: 'Stall 5',
          purchase_count: 1,
          debt_balance: 500,
          created_at: '2026-10-01T08:00:00Z',
          updated_at: '2026-10-01T08:00:00Z',
        },
      ];

      const sales: SaleSummary[] = [
        {
          id: 's-overdue',
          receipt_number: 'ARLQ-00999',
          customer_id: 'k-overdue',
          total_amount: 1000,
          amount_paid: 500,
          balance: 500,
          payment_status: 'Partially Paid',
          order_status: 'Delivered',
          created_at: '2026-10-28T12:00:00.000Z', // 9 days before 2026-11-06T12:00:00Z
        },
      ];

      const summary = calculateCustomerUtangSummary(customers, sales, {
        reminderDays: 7,
        asOfDate: fixedAsOf,
      });

      assert.strictEqual(summary.rows.length, 1);
      const row = summary.rows[0];
      assert.strictEqual(row.days_outstanding, 9);
      assert.strictEqual(row.is_overdue, true);
      assert.strictEqual(row.status, 'Overdue');
      assert.strictEqual(summary.overdue_owed, 500);
      assert.strictEqual(summary.overdue_debtors, 1);
    });
  });

  describe('Scenario 3: Not yet due debt flagging', () => {
    it('flags customer with oldest unpaid sale < reminderDays (3 days < 7) as Not yet due in warning amber and excludes from overdue KPI', () => {
      const customers: CustomerWithRollup[] = [
        {
          id: 'k-recent',
          name: 'Recent Corner Shop',
          phone: '0922 333 4455',
          address: 'Plaza 2',
          purchase_count: 1,
          debt_balance: 350,
          created_at: '2026-10-01T08:00:00Z',
          updated_at: '2026-10-01T08:00:00Z',
        },
      ];

      const sales: SaleSummary[] = [
        {
          id: 's-recent',
          receipt_number: 'ARLQ-00998',
          customer_id: 'k-recent',
          total_amount: 350,
          amount_paid: 0,
          balance: 350,
          payment_status: 'Not Yet Paid',
          order_status: 'Delivered',
          created_at: '2026-11-03T12:00:00.000Z', // 3 days before 2026-11-06T12:00:00Z
        },
      ];

      const summary = calculateCustomerUtangSummary(customers, sales, {
        reminderDays: 7,
        asOfDate: fixedAsOf,
      });

      assert.strictEqual(summary.rows.length, 1);
      const row = summary.rows[0];
      assert.strictEqual(row.days_outstanding, 3);
      assert.strictEqual(row.is_overdue, false);
      assert.strictEqual(row.status, 'Not yet due');
      assert.strictEqual(summary.total_owed, 350);
      assert.strictEqual(summary.overdue_owed, 0);
      assert.strictEqual(summary.overdue_debtors, 0);
    });
  });

  describe('Scenario 4 & 5: Direct profile and receipt navigation URL contracts', () => {
    it('provides valid customer_id and oldest_sale_id for navigational links', () => {
      const customers: CustomerWithRollup[] = [
        {
          id: 'cust-xyz-123',
          name: 'Sample Canteen',
          phone: '0918 123 4567',
          address: 'Market Hall',
          purchase_count: 1,
          debt_balance: 750,
          created_at: '2026-10-01T08:00:00Z',
          updated_at: '2026-10-01T08:00:00Z',
        },
      ];

      const sales: SaleSummary[] = [
        {
          id: 'sale-abc-789',
          receipt_number: 'ARLQ-02001',
          customer_id: 'cust-xyz-123',
          total_amount: 750,
          amount_paid: 0,
          balance: 750,
          payment_status: 'Not Yet Paid',
          order_status: 'Delivered',
          created_at: '2026-10-20T12:00:00.000Z',
        },
      ];

      const summary = calculateCustomerUtangSummary(customers, sales, {
        reminderDays: 7,
        asOfDate: fixedAsOf,
      });

      const row = summary.rows[0];
      // Profile target URL check
      const profileHref = `/customers/${row.customer_id}`;
      assert.strictEqual(profileHref, '/customers/cust-xyz-123');

      // Sale receipt target URL check
      const saleHref = `/sales/${row.oldest_sale_id}`;
      assert.strictEqual(saleHref, '/sales/sale-abc-789');
    });
  });

  describe('Scenario 6: All accounts settled empty state', () => {
    it('returns empty rows array and zeroed KPI totals when all balances are paid', () => {
      const customers: CustomerWithRollup[] = [
        {
          id: 'k1',
          name: 'Settled Customer 1',
          phone: '0911 111 1111',
          address: 'Town Center',
          purchase_count: 2,
          debt_balance: 0,
          created_at: '2026-10-01T08:00:00Z',
          updated_at: '2026-10-01T08:00:00Z',
        },
      ];

      const sales: SaleSummary[] = [
        {
          id: 's1',
          receipt_number: 'ARLQ-01001',
          customer_id: 'k1',
          total_amount: 500,
          amount_paid: 500,
          balance: 0,
          payment_status: 'Paid',
          order_status: 'Delivered',
          created_at: '2026-10-15T08:00:00Z',
        },
      ];

      const summary = calculateCustomerUtangSummary(customers, sales, {
        reminderDays: 7,
        asOfDate: fixedAsOf,
      });

      assert.strictEqual(summary.rows.length, 0);
      assert.strictEqual(summary.total_owed, 0);
      assert.strictEqual(summary.total_debtors, 0);
      assert.strictEqual(summary.overdue_owed, 0);
      assert.strictEqual(summary.overdue_debtors, 0);
    });
  });

  describe('End-to-End Service Integration with Seed Data', () => {
    it('retrieves and aggregates customer utang summary from memory store accurately', async () => {
      const summary = await getCustomerUtangSummary(null, fixedAsOf);

      assert.ok(summary.rows.length >= 4, 'Should include seeded debtors');
      assert.strictEqual(summary.total_owed, 2080);
      assert.strictEqual(summary.overdue_owed, 1880);
      assert.strictEqual(summary.reminder_days, 7);
      assert.strictEqual(summary.admin_mobile, '0917 555 0142');

      // Verify oldest debt is first
      for (let i = 0; i < summary.rows.length - 1; i++) {
        assert.ok(
          summary.rows[i].days_outstanding >= summary.rows[i + 1].days_outstanding,
          `Row ${i} (${summary.rows[i].days_outstanding}d) must be >= Row ${i + 1} (${summary.rows[i + 1].days_outstanding}d)`
        );
      }
    });
  });

  describe('Feature ARL-37: Customer Profile Persistence & Real-Time Balances Cache Invalidation', () => {
    it('updates customer contact details immediately across the utang summary without stale data', async () => {
      const { updateCustomer, getCustomerUtangSummary } = await import(
        '../lib/customers/customer-service.ts'
      );

      // Initially, k1 debtor row has phone '0917 301 4488'
      const initialSummary = await getCustomerUtangSummary(null, fixedAsOf);
      const k1Initial = initialSummary.rows.find((r) => r.customer_id === 'k1');
      assert.ok(k1Initial);
      assert.strictEqual(k1Initial.phone, '0917 301 4488');

      // Update phone number to '0917 999 8888'
      await updateCustomer('k1', {
        name: "Aling Nena's Sari-Sari Store",
        phone: '0917 999 8888',
        address: 'Purok 3, Brgy. San Roque',
      });

      // Fetch summary again: immediately reflects updated contact number
      const updatedSummary = await getCustomerUtangSummary(null, fixedAsOf);
      const k1Updated = updatedSummary.rows.find((r) => r.customer_id === 'k1');
      assert.ok(k1Updated);
      assert.strictEqual(k1Updated.phone, '0917 999 8888');
    });

    it('removes customer from utang tracker when balance is settled, while keeping them in directory', async () => {
      const {
        getCustomerUtangSummary,
        getCustomerDirectory,
        updateCustomerSalePayment,
      } = await import('../lib/customers/customer-service.ts');

      // Check k1 before settlement: owes 1340 on sale s2
      const initialSummary = await getCustomerUtangSummary(null, fixedAsOf);
      assert.ok(initialSummary.rows.some((r) => r.customer_id === 'k1'));

      // Settle sale s2 completely via updateCustomerSalePayment
      updateCustomerSalePayment('s2', 1340, 'Paid');

      // Verify k1 is now removed from utang summary
      const afterPaymentSummary = await getCustomerUtangSummary(null, fixedAsOf);
      assert.strictEqual(
        afterPaymentSummary.rows.some((r) => r.customer_id === 'k1'),
        false,
        'Settled customer must be excluded from utang balances list'
      );

      // Verify k1 remains fully present in customer directory with 0 balance
      const directory = await getCustomerDirectory(null);
      const k1InDir = directory.find((c) => c.id === 'k1');
      assert.ok(k1InDir, 'Customer k1 must remain in customer directory');
      assert.strictEqual(k1InDir.debt_balance, 0, 'Debt balance must be 0 in directory');
    });

    it('new customer with 0 balance appears in directory but is omitted from utang tracker', async () => {
      const { createCustomer, getCustomerDirectory, getCustomerUtangSummary } = await import(
        '../lib/customers/customer-service.ts'
      );

      const newCust = await createCustomer({
        name: 'Aling Roselle',
        phone: '0918 000 1111',
        address: 'Market Site',
      });

      // Excluded from utang tracker
      const utang = await getCustomerUtangSummary(null, fixedAsOf);
      assert.strictEqual(
        utang.rows.some((r) => r.customer_id === newCust.id),
        false,
        'Customer with ₱0 balance must not appear on utang tracker'
      );

      // Included in directory
      const directory = await getCustomerDirectory(null);
      const found = directory.find((c) => c.id === newCust.id);
      assert.ok(found, 'Must appear in customer directory');
      assert.strictEqual(found.name, 'Aling Roselle');
    });
  });
});
