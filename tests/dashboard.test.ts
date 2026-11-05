import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DashboardService,
} from '../lib/dashboard/dashboard-service.ts';
import {
  formatPeso,
  computeStockCapacityPercentage,
} from '../lib/dashboard/dashboard-contracts.ts';
import type { SaleTransactionDTO } from '../lib/sales/sale-contracts.ts';
import type { ProductWithVariants } from '../lib/products/product-service.ts';

describe('Feature ARL-18: Executive Dashboard with KPI Cards, Sales Chart & Urgent Notices', () => {
  const service = new DashboardService(null);
  const fixedAsOf = new Date('2026-11-06T12:00:00.000Z');

  describe('Helper Utilities & Formatters', () => {
    it('formatPeso formats amounts with and without decimals correctly', () => {
      assert.equal(formatPeso(1240), '₱1,240');
      assert.equal(formatPeso(1340.5, true), '₱1,340.50');
      assert.equal(formatPeso(0), '₱0');
      assert.equal(formatPeso(-500), '-₱500');
    });

    it('computeStockCapacityPercentage computes accurate ratio clamped to 100%', () => {
      // min = 20 -> max threshold (2.5 * 20) = 50
      assert.equal(computeStockCapacityPercentage(25, 20), 50);
      assert.equal(computeStockCapacityPercentage(50, 20), 100);
      assert.equal(computeStockCapacityPercentage(100, 20), 100);
      assert.equal(computeStockCapacityPercentage(0, 20), 0);
      // Zero min stock level fallback
      assert.equal(computeStockCapacityPercentage(10, 0), 100);
    });
  });

  describe('Scenario 1: Executive KPI Metrics Computation', () => {
    it('computes sales today (₱1,240 across 3 transactions), 2 low stock variants, and outstanding balances', () => {
      const mockSales: SaleTransactionDTO[] = [
        {
          id: 's-today-1',
          receipt_number: 'ARLQ-001',
          customer_id: 'c1',
          total_amount: 500,
          amount_paid: 500,
          balance: 0,
          payment_status: 'Paid',
          order_status: 'Delivered',
          gross_profit: 100,
          items: [],
          created_at: '2026-11-06T08:00:00.000Z',
          updated_at: '2026-11-06T08:00:00.000Z',
        },
        {
          id: 's-today-2',
          receipt_number: 'ARLQ-002',
          customer_id: 'c2',
          total_amount: 440,
          amount_paid: 200,
          balance: 240,
          payment_status: 'Partially Paid',
          order_status: 'Pending',
          gross_profit: 80,
          items: [],
          created_at: '2026-11-06T09:30:00.000Z',
          updated_at: '2026-11-06T09:30:00.000Z',
        },
        {
          id: 's-today-3',
          receipt_number: 'ARLQ-003',
          customer_id: 'c3',
          total_amount: 300,
          amount_paid: 0,
          balance: 300,
          payment_status: 'Not Yet Paid',
          order_status: 'Pending',
          gross_profit: 60,
          items: [],
          created_at: '2026-11-06T10:15:00.000Z',
          updated_at: '2026-11-06T10:15:00.000Z',
        },
        {
          id: 's-yesterday',
          receipt_number: 'ARLQ-000',
          customer_id: 'c1',
          total_amount: 800,
          amount_paid: 0,
          balance: 800,
          payment_status: 'Not Yet Paid',
          order_status: 'Pending',
          gross_profit: 200,
          items: [],
          created_at: '2026-11-05T14:00:00.000Z',
          updated_at: '2026-11-05T14:00:00.000Z',
        },
      ];

      const mockProducts: ProductWithVariants[] = [
        {
          id: 'prod-toyo',
          name: 'Toyo',
          category_id: 'cat-1',
          created_at: '2026-10-01T00:00:00.000Z',
          updated_at: '2026-10-01T00:00:00.000Z',
          variants: [
            {
              id: 'toyo-350',
              product_id: 'prod-toyo',
              size: '350',
              cost_price: 14,
              selling_price: 20,
              unit_profit: 6,
              stock_quantity: 40,
              min_stock_level: 48, // LOW (40 <= 48)
              created_at: '',
              updated_at: '',
            },
            {
              id: 'toyo-1L',
              product_id: 'prod-toyo',
              size: '1L',
              cost_price: 38,
              selling_price: 50,
              unit_profit: 12,
              stock_quantity: 58,
              min_stock_level: 30, // OK
              created_at: '',
              updated_at: '',
            },
            {
              id: 'toyo-gal',
              product_id: 'prod-toyo',
              size: 'gal',
              cost_price: 125,
              selling_price: 160,
              unit_profit: 35,
              stock_quantity: 17,
              min_stock_level: 12, // OK
              created_at: '',
              updated_at: '',
            },
          ],
        },
        {
          id: 'prod-suka',
          name: 'Suka',
          category_id: 'cat-2',
          created_at: '2026-10-01T00:00:00.000Z',
          updated_at: '2026-10-01T00:00:00.000Z',
          variants: [
            {
              id: 'suka-350',
              product_id: 'prod-suka',
              size: '350',
              cost_price: 11,
              selling_price: 16,
              unit_profit: 5,
              stock_quantity: 20,
              min_stock_level: 25, // LOW (20 <= 25)
              created_at: '',
              updated_at: '',
            },
            {
              id: 'suka-1L',
              product_id: 'prod-suka',
              size: '1L',
              cost_price: 32,
              selling_price: 45,
              unit_profit: 13,
              stock_quantity: 60,
              min_stock_level: 30, // OK
              created_at: '',
              updated_at: '',
            },
            {
              id: 'suka-gal',
              product_id: 'prod-suka',
              size: 'gal',
              cost_price: 110,
              selling_price: 145,
              unit_profit: 35,
              stock_quantity: 15,
              min_stock_level: 10, // OK
              created_at: '',
              updated_at: '',
            },
          ],
        },
        {
          id: 'prod-patis',
          name: 'Patis',
          category_id: 'cat-3',
          created_at: '2026-10-01T00:00:00.000Z',
          updated_at: '2026-10-01T00:00:00.000Z',
          variants: [
            {
              id: 'patis-350',
              product_id: 'prod-patis',
              size: '350',
              cost_price: 18,
              selling_price: 25,
              unit_profit: 7,
              stock_quantity: 45,
              min_stock_level: 20, // OK
              created_at: '',
              updated_at: '',
            },
            {
              id: 'patis-1L',
              product_id: 'prod-patis',
              size: '1L',
              cost_price: 45,
              selling_price: 60,
              unit_profit: 15,
              stock_quantity: 35,
              min_stock_level: 20, // OK
              created_at: '',
              updated_at: '',
            },
            {
              id: 'patis-gal',
              product_id: 'prod-patis',
              size: 'gal',
              cost_price: 160,
              selling_price: 200,
              unit_profit: 40,
              stock_quantity: 20,
              min_stock_level: 10, // OK
              created_at: '',
              updated_at: '',
            },
          ],
        },
      ];

      const kpis = service.calculateKpis(mockSales, mockProducts, fixedAsOf);

      assert.equal(kpis.sales_today, 1240, 'Sales today must sum to ₱1,240');
      assert.equal(kpis.transactions_today, 3, 'Transactions today must count 3');
      assert.equal(kpis.low_stock_count, 2, 'Low stock count must be 2');
      assert.equal(kpis.total_variants_count, 9, 'Total variants must be 9');
      assert.equal(kpis.outstanding_balances, 1340, 'Outstanding balances must sum 240 + 300 + 800 = 1340');
      assert.equal(kpis.unpaid_sales_count, 3, 'Unpaid sales count must be 3');
      assert.equal(kpis.sales_this_month, 2040, 'Sales this month must sum 1240 + 800 = 2040');
      assert.equal(kpis.profit_this_month, 440, 'Profit this month must sum 100 + 80 + 60 + 200 = 440');
    });
  });

  describe('Scenario 2: 7-Day Sales Visualizer Bar Chart Rendering', () => {
    it('builds 7 sequential day buckets with proportional heights and highlights day 0 as Today', () => {
      const mockSales: SaleTransactionDTO[] = [
        {
          id: 's-t0',
          receipt_number: 'ARLQ-01',
          customer_id: 'c1',
          total_amount: 1000,
          amount_paid: 1000,
          balance: 0,
          payment_status: 'Paid',
          order_status: 'Delivered',
          gross_profit: 250,
          items: [],
          created_at: '2026-11-06T10:00:00.000Z', // Today (offset 0)
          updated_at: '',
        },
        {
          id: 's-t1',
          receipt_number: 'ARLQ-02',
          customer_id: 'c1',
          total_amount: 500,
          amount_paid: 500,
          balance: 0,
          payment_status: 'Paid',
          order_status: 'Delivered',
          gross_profit: 125,
          items: [],
          created_at: '2026-11-05T10:00:00.000Z', // 1 day ago
          updated_at: '',
        },
        {
          id: 's-t3',
          receipt_number: 'ARLQ-03',
          customer_id: 'c1',
          total_amount: 2000,
          amount_paid: 2000,
          balance: 0,
          payment_status: 'Paid',
          order_status: 'Delivered',
          gross_profit: 500,
          items: [],
          created_at: '2026-11-03T10:00:00.000Z', // 3 days ago (MAX)
          updated_at: '',
        },
      ];

      const chart = service.buildSalesChart(mockSales, fixedAsOf);

      assert.equal(chart.length, 7, 'Must generate exactly 7 day buckets');
      
      // Bucket 6 should be Today (offset 0)
      const todayBucket = chart[6];
      assert.equal(todayBucket.is_today, true);
      assert.equal(todayBucket.day_label, 'Today');
      assert.equal(todayBucket.revenue, 1000);
      // Max revenue is 2000 (from 3 days ago, index 3). Today should be 1000/2000 = 50%
      assert.equal(todayBucket.height_percentage, 50);

      // Bucket at offset 3 (index 3) should be 100%
      const maxBucket = chart[3];
      assert.equal(maxBucket.revenue, 2000);
      assert.equal(maxBucket.height_percentage, 100);

      // Empty days must maintain minimum 1.5% height for visual baseline
      const emptyBucket = chart[0]; // 6 days ago
      assert.equal(emptyBucket.revenue, 0);
      assert.equal(emptyBucket.height_percentage, 1.5);
    });
  });

  describe('Scenario 3: Stock On Hand 3x3 Matrix Table', () => {
    it('produces 3 products each with 3 standard size variants and calculates capacity meters', () => {
      const mockProducts: ProductWithVariants[] = [
        {
          id: 'prod-toyo',
          name: 'Toyo',
          category_id: 'cat-1',
          created_at: '',
          updated_at: '',
          variants: [
            {
              id: 'toyo-350',
              product_id: 'prod-toyo',
              size: '350',
              cost_price: 14,
              selling_price: 20,
              unit_profit: 6,
              stock_quantity: 24,
              min_stock_level: 24, // Low stock: 24 <= 24
              created_at: '',
              updated_at: '',
            },
            {
              id: 'toyo-1L',
              product_id: 'prod-toyo',
              size: '1L',
              cost_price: 38,
              selling_price: 50,
              unit_profit: 12,
              stock_quantity: 60,
              min_stock_level: 30, // 60 / (30 * 2.5) = 80%
              created_at: '',
              updated_at: '',
            },
            {
              id: 'toyo-gal',
              product_id: 'prod-toyo',
              size: 'gal',
              cost_price: 125,
              selling_price: 160,
              unit_profit: 35,
              stock_quantity: 30,
              min_stock_level: 10, // 30 / 25 > 100% -> clamped to 100%
              created_at: '',
              updated_at: '',
            },
          ],
        },
      ];

      const matrix = service.buildStockMatrix(mockProducts);

      assert.equal(matrix.length, 1);
      assert.equal(matrix[0].product_name, 'Toyo');
      assert.equal(matrix[0].variants.length, 3);

      const [v350, v1L, vGal] = matrix[0].variants;
      assert.equal(v350.size_key, '350');
      assert.equal(v350.is_low, true);
      assert.equal(v350.capacity_percentage, 40); // 24 / 60 = 40%

      assert.equal(v1L.size_key, '1L');
      assert.equal(v1L.is_low, false);
      assert.equal(v1L.capacity_percentage, 80);

      assert.equal(vGal.size_key, 'gal');
      assert.equal(vGal.is_low, false);
      assert.equal(vGal.capacity_percentage, 100);
    });
  });

  describe('Scenario 4: Urgent Notice Stream Action Navigation', () => {
    it('generates overdue notice for Aling Nena with ₱1,340 debt and Open sale link', () => {
      const mockSales: SaleTransactionDTO[] = [
        {
          id: 's-nena',
          receipt_number: 'ARLQ-01058',
          customer_id: 'c-nena',
          customer_name: "Aling Nena's Sari-Sari Store",
          total_amount: 1340,
          amount_paid: 0,
          balance: 1340,
          payment_status: 'Not Yet Paid',
          order_status: 'Pending',
          gross_profit: 295,
          items: [],
          created_at: new Date(fixedAsOf.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: '',
        },
      ];

      const mockProducts: ProductWithVariants[] = [
        {
          id: 'prod-toyo',
          name: 'Toyo',
          category_id: 'cat-1',
          created_at: '',
          updated_at: '',
          variants: [
            {
              id: 'toyo-1L',
              product_id: 'prod-toyo',
              size: '1L',
              cost_price: 38,
              selling_price: 50,
              unit_profit: 12,
              stock_quantity: 14,
              min_stock_level: 15,
              created_at: '',
              updated_at: '',
            },
          ],
        },
      ];

      const notices = service.buildUrgentNotices(mockSales, mockProducts, 7, fixedAsOf);

      assert.equal(notices.length, 2, 'Must generate 1 overdue notice and 1 low stock notice');

      const overdueNotice = notices.find((n) => n.type === 'overdue_debt');
      assert.ok(overdueNotice);
      assert.equal(overdueNotice.title, "Aling Nena's Sari-Sari Store");
      assert.match(overdueNotice.message, /1,340/);
      assert.equal(overdueNotice.badge_tone, 'bad');
      assert.equal(overdueNotice.action_label, 'Open sale');
      assert.equal(overdueNotice.action_href, '/sales/s-nena');

      const lowStockNotice = notices.find((n) => n.type === 'low_stock');
      assert.ok(lowStockNotice);
      assert.equal(lowStockNotice.title, 'Toyo - 1 L');
      assert.equal(lowStockNotice.message, 'is running low');
      assert.equal(lowStockNotice.badge_tone, 'warn');
      assert.equal(lowStockNotice.action_label, 'Stock in');
      assert.equal(lowStockNotice.action_href, '/inventory/in');
    });
  });

  describe('Scenario 5: Who Owes You Debtor Ranking', () => {
    it('sorts debtors descending by total debt and flags overdue status', () => {
      const mockSales: SaleTransactionDTO[] = [
        {
          id: 's-rosa',
          receipt_number: 'ARLQ-01',
          customer_id: 'c3',
          customer_name: 'Nanay Rosa',
          total_amount: 1800,
          amount_paid: 0,
          balance: 1800,
          payment_status: 'Not Yet Paid',
          order_status: 'Delivered',
          gross_profit: 400,
          items: [],
          created_at: new Date(fixedAsOf.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: '',
        },
        {
          id: 's-nena',
          receipt_number: 'ARLQ-02',
          customer_id: 'c1',
          customer_name: 'Aling Nena',
          total_amount: 1340,
          amount_paid: 0,
          balance: 1340,
          payment_status: 'Not Yet Paid',
          order_status: 'Delivered',
          gross_profit: 295,
          items: [],
          created_at: new Date(fixedAsOf.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: '',
        },
        {
          id: 's-tonyo',
          receipt_number: 'ARLQ-03',
          customer_id: 'c2',
          customer_name: 'Mang Tonyo',
          total_amount: 240,
          amount_paid: 0,
          balance: 240,
          payment_status: 'Not Yet Paid',
          order_status: 'Delivered',
          gross_profit: 50,
          items: [],
          created_at: new Date(fixedAsOf.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: '',
        },
        {
          id: 's-jobert',
          receipt_number: 'ARLQ-04',
          customer_id: 'c4',
          customer_name: 'Kuya Jobert',
          total_amount: 500,
          amount_paid: 500,
          balance: 0,
          payment_status: 'Paid',
          order_status: 'Delivered',
          gross_profit: 100,
          items: [],
          created_at: new Date(fixedAsOf.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: '',
        },
      ];

      const ranking = service.buildDebtRanking(mockSales, undefined, 7, fixedAsOf);

      assert.equal(ranking.length, 3, 'Excludes customers with 0 debt');
      assert.equal(ranking[0].customer_name, 'Nanay Rosa', 'Top debtor first');
      assert.equal(ranking[0].total_debt, 1800);
      assert.equal(ranking[0].is_overdue, false, '3 days < 7 reminder threshold');

      assert.equal(ranking[1].customer_name, 'Aling Nena');
      assert.equal(ranking[1].total_debt, 1340);
      assert.equal(ranking[1].is_overdue, true, '9 days >= 7 reminder threshold');

      assert.equal(ranking[2].customer_name, 'Mang Tonyo');
      assert.equal(ranking[2].total_debt, 240);
      assert.equal(ranking[2].is_overdue, true, '10 days >= 7 reminder threshold');
    });
  });

  describe('Scenario 6: Empty States Resilience', () => {
    it('returns empty notices and empty debt ranking when all debts are 0 and stock is plentiful', () => {
      const emptyNotices = service.buildUrgentNotices([], [], 7, fixedAsOf);
      assert.deepEqual(emptyNotices, []);

      const emptyDebts = service.buildDebtRanking([], undefined, 7, fixedAsOf);
      assert.deepEqual(emptyDebts, []);
    });
  });
});
