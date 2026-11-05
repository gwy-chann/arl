/**
 * Automated Test Suite: Multi-Dimensional Reporting Aggregation & Export
 * Feature: ARL-20 (STORY-4.3)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateSalesReport,
  aggregateInventoryReport,
  aggregateMovementReport,
  aggregateLowStockReport,
  aggregateCustomerBalancesReport,
  aggregateProfitReport,
  calculateWeightedMargin,
  filterMatchesVariant,
  getVariantStockStatus,
  type ProductReference,
  type VariantReference,
  type SaleReference,
  type StockMovementReference,
  type CustomerReference,
} from '../lib/reports/report-service.ts';
import { generateCsvString, escapeCsvCell } from '../lib/reports/csv-export.ts';

// Test Fixtures
const testProducts: ProductReference[] = [
  { id: 'prod-toyo', name: 'Toyo' },
  { id: 'prod-suka', name: 'Suka' },
  { id: 'prod-patis', name: 'Patis' },
];

const testVariants: VariantReference[] = [
  {
    id: 'var-toyo-350',
    product_id: 'prod-toyo',
    size: '350',
    cost_price: 18,
    selling_price: 25,
    stock_quantity: 40,
    min_stock_level: 20,
  },
  {
    id: 'var-toyo-1L',
    product_id: 'prod-toyo',
    size: '1L',
    cost_price: 45,
    selling_price: 65,
    stock_quantity: 15,
    min_stock_level: 25, // Low stock: 15 <= 25
  },
  {
    id: 'var-suka-1L',
    product_id: 'prod-suka',
    size: '1L',
    cost_price: 35,
    selling_price: 50,
    stock_quantity: 30,
    min_stock_level: 15,
  },
  {
    id: 'var-patis-gal',
    product_id: 'prod-patis',
    size: 'gal',
    cost_price: 180,
    selling_price: 250,
    stock_quantity: 5,
    min_stock_level: 10, // Low stock: 5 <= 10
  },
];

const refDate = new Date('2026-11-06T12:00:00Z');

const testSales: SaleReference[] = [
  // Today's sale
  {
    id: 'sale-001',
    receipt_number: 'ARLQ-01001',
    customer_id: 'cust-1',
    total_amount: 380, // 2x toyo 1L (130) + 1x patis gal (250)
    amount_paid: 200,
    created_at: new Date('2026-11-06T09:00:00Z').toISOString(),
    items: [
      { variant_id: 'var-toyo-1L', quantity: 2, unit_price: 65, unit_cost: 45 },
      { variant_id: 'var-patis-gal', quantity: 1, unit_price: 250, unit_cost: 180 },
    ],
  },
  // Yesterday's sale
  {
    id: 'sale-002',
    receipt_number: 'ARLQ-01002',
    customer_id: 'cust-2',
    total_amount: 100, // 2x suka 1L (100)
    amount_paid: 100,
    created_at: new Date('2026-11-05T14:00:00Z').toISOString(),
    items: [
      { variant_id: 'var-suka-1L', quantity: 2, unit_price: 50, unit_cost: 35 },
    ],
  },
  // 10 days ago (last week)
  {
    id: 'sale-003',
    receipt_number: 'ARLQ-01003',
    customer_id: 'cust-1',
    total_amount: 50, // 2x toyo 350 (50)
    amount_paid: 0,
    created_at: new Date('2026-10-27T10:00:00Z').toISOString(),
    items: [
      { variant_id: 'var-toyo-350', quantity: 2, unit_price: 25, unit_cost: 18 },
    ],
  },
];

const testMovements: StockMovementReference[] = [
  // Within last 7 days
  {
    id: 'mov-1',
    variant_id: 'var-toyo-1L',
    movement_type: 'In',
    quantity: 20,
    created_at: new Date('2026-11-04T10:00:00Z').toISOString(),
  },
  {
    id: 'mov-2',
    variant_id: 'var-toyo-1L',
    movement_type: 'Out',
    quantity: 5,
    created_at: new Date('2026-11-05T10:00:00Z').toISOString(),
  },
  // 15 days ago (outside 7 days, inside 30 days)
  {
    id: 'mov-3',
    variant_id: 'var-toyo-1L',
    movement_type: 'In',
    quantity: 10,
    created_at: new Date('2026-10-22T10:00:00Z').toISOString(),
  },
];

const testCustomers: CustomerReference[] = [
  { id: 'cust-1', name: 'Mang Tonyo Carinderia' },
  { id: 'cust-2', name: 'Aling Nena Store' },
  { id: 'cust-3', name: 'Paid Customer' },
];

describe('Feature ARL-20: Multi-Dimensional Tabbed Reporting Suite', () => {
  describe('Scenario 1: Earnings & Profit Margin Breakdown (/reports/profit)', () => {
    it('calculates bottles sold, revenue, cost, profit, and margin % per variant for last 30 days', () => {
      const summary = aggregateProfitReport(
        testSales,
        testVariants,
        testProducts,
        { range: '30', productId: 'all', size: 'all' },
        refDate
      );

      // Should include 4 sold items: var-toyo-1L (2 sold), var-patis-gal (1 sold), var-suka-1L (2 sold), var-toyo-350 (2 sold)
      assert.equal(summary.rows.length, 4);

      // Toyo 1L: 2 sold, rev = 130, cost = 90, profit = 40, margin = 40 / 130 = 31%
      const toyo1L = summary.rows.find((r) => r.variantId === 'var-toyo-1L');
      assert.ok(toyo1L);
      assert.equal(toyo1L.bottlesSold, 2);
      assert.equal(toyo1L.revenue, 130);
      assert.equal(toyo1L.cost, 90);
      assert.equal(toyo1L.profit, 40);
      assert.equal(toyo1L.marginPercent, 31);

      // Patis Gal: 1 sold, rev = 250, cost = 180, profit = 70, margin = 70 / 250 = 28%
      const patisGal = summary.rows.find((r) => r.variantId === 'var-patis-gal');
      assert.ok(patisGal);
      assert.equal(patisGal.bottlesSold, 1);
      assert.equal(patisGal.revenue, 250);
      assert.equal(patisGal.cost, 180);
      assert.equal(patisGal.profit, 70);
      assert.equal(patisGal.marginPercent, 28);
    });

    it('calculates accurate overall totals and weighted margin % in footer row', () => {
      const summary = aggregateProfitReport(
        testSales,
        testVariants,
        testProducts,
        { range: '30', productId: 'all', size: 'all' },
        refDate
      );

      // Total sold: 2 (toyo 1L) + 1 (patis gal) + 2 (suka 1L) + 2 (toyo 350) = 7
      assert.equal(summary.totalBottlesSold, 7);

      // Total revenue: 130 + 250 + 100 + 50 = 530
      assert.equal(summary.totalRevenue, 530);

      // Total cost: 90 + 180 + 70 + 36 = 376
      assert.equal(summary.totalCost, 376);

      // Total profit: 530 - 376 = 154
      assert.equal(summary.totalProfit, 154);

      // Weighted margin: round((154 / 530) * 100) = 29%
      assert.equal(summary.weightedMarginPercent, 29);
    });

    it('handles zero sales gracefully without division by zero errors', () => {
      const summary = aggregateProfitReport(
        [],
        testVariants,
        testProducts,
        { range: '30', productId: 'all', size: 'all' },
        refDate
      );

      assert.equal(summary.rows.length, 0);
      assert.equal(summary.totalRevenue, 0);
      assert.equal(summary.totalProfit, 0);
      assert.equal(summary.weightedMarginPercent, 0);
    });
  });

  describe('Scenario 2: Dynamic Filter Toolbar Slicing (/reports/sales)', () => {
    it('filters sales report by daily period (today vs yesterday)', () => {
      const summary = aggregateSalesReport(
        testSales,
        testProducts,
        testVariants,
        { tab: 'sales', period: 'daily', range: '30', productId: 'all', size: 'all' },
        refDate
      );

      assert.equal(summary.rows.length, 7);
      // Today (sale-001): 3 bottles sold (2 toyo 1L, 1 patis gal), rev = 380, cost = 270, profit = 110
      const todayRow = summary.rows[0];
      assert.equal(todayRow.periodLabel, 'Today');
      assert.equal(todayRow.transactionsCount, 1);
      assert.equal(todayRow.bottlesSold, 3);
      assert.equal(todayRow.revenue, 380);
      assert.equal(todayRow.profit, 110);

      // Yesterday (sale-002): 2 bottles sold (suka 1L), rev = 100, cost = 70, profit = 30
      const yesterdayRow = summary.rows[1];
      assert.equal(yesterdayRow.periodLabel, 'Yesterday');
      assert.equal(yesterdayRow.transactionsCount, 1);
      assert.equal(yesterdayRow.bottlesSold, 2);
      assert.equal(yesterdayRow.revenue, 100);
      assert.equal(yesterdayRow.profit, 30);
    });

    it('slices sales report by product filter "Toyo" only', () => {
      const summary = aggregateSalesReport(
        testSales,
        testProducts,
        testVariants,
        { tab: 'sales', period: 'daily', range: '30', productId: 'prod-toyo', size: 'all' },
        refDate
      );

      // Today row should reflect ONLY Toyo 1L (2 bottles, rev 130, profit 40), excluding Patis
      const todayRow = summary.rows[0];
      assert.equal(todayRow.transactionsCount, 1);
      assert.equal(todayRow.bottlesSold, 2);
      assert.equal(todayRow.revenue, 130);
      assert.equal(todayRow.profit, 40);

      // Yesterday row had only Suka, so for Toyo it should be 0
      const yesterdayRow = summary.rows[1];
      assert.equal(yesterdayRow.transactionsCount, 0);
      assert.equal(yesterdayRow.bottlesSold, 0);
      assert.equal(yesterdayRow.revenue, 0);
      assert.equal(yesterdayRow.profit, 0);
    });

    it('aggregates sales report across 3 monthly buckets', () => {
      const summary = aggregateSalesReport(
        testSales,
        testProducts,
        testVariants,
        { tab: 'sales', period: 'monthly', range: '30', productId: 'all', size: 'all' },
        refDate
      );

      assert.equal(summary.rows.length, 3);
      // Month 0 (November 2026): includes sale-001 and sale-002 -> 3 + 2 = 5 bottles sold
      assert.match(summary.rows[0].periodLabel, /November 2026/);
      assert.equal(summary.rows[0].transactionsCount, 2);
      assert.equal(summary.rows[0].bottlesSold, 5);
      assert.equal(summary.rows[0].revenue, 480);

      // Month 1 (October 2026): includes sale-003 -> 2 bottles sold (toyo 350)
      assert.match(summary.rows[1].periodLabel, /October 2026/);
      assert.equal(summary.rows[1].transactionsCount, 1);
      assert.equal(summary.rows[1].bottlesSold, 2);
      assert.equal(summary.rows[1].revenue, 50);
    });
  });

  describe('Scenario 3: Inventory Valuation by Cost vs Selling Price (/reports/inventory)', () => {
    it('computes value at cost and selling price per variant and overall totals', () => {
      const summary = aggregateInventoryReport(
        testVariants,
        testProducts,
        { productId: 'all', size: 'all' }
      );

      assert.equal(summary.rows.length, 4);

      // var-toyo-350: stock 40, cost 18 (720), price 25 (1000)
      const toyo350 = summary.rows.find((r) => r.variantId === 'var-toyo-350');
      assert.ok(toyo350);
      assert.equal(toyo350.valueAtCost, 720);
      assert.equal(toyo350.valueAtSellingPrice, 1000);
      assert.equal(toyo350.status, 'In stock');

      // var-toyo-1L: stock 15, min 25 -> Low stock! cost 45 (675), price 65 (975)
      const toyo1L = summary.rows.find((r) => r.variantId === 'var-toyo-1L');
      assert.ok(toyo1L);
      assert.equal(toyo1L.valueAtCost, 675);
      assert.equal(toyo1L.valueAtSellingPrice, 975);
      assert.equal(toyo1L.status, 'Low stock');

      // Totals check:
      // Units: 40 + 15 + 30 + 5 = 90
      assert.equal(summary.totalUnitsInStock, 90);
      // Cost: 720 + 675 + (30*35=1050) + (5*180=900) = 3345
      assert.equal(summary.totalValueAtCost, 3345);
      // Selling price: 1000 + 975 + (30*50=1500) + (5*250=1250) = 4725
      assert.equal(summary.totalValueAtSellingPrice, 4725);
    });

    it('filters inventory valuation by specific size (e.g. 1L)', () => {
      const summary = aggregateInventoryReport(
        testVariants,
        testProducts,
        { productId: 'all', size: '1L' }
      );

      // Only toyo-1L and suka-1L
      assert.equal(summary.rows.length, 2);
      assert.equal(summary.totalUnitsInStock, 45); // 15 + 30
    });
  });

  describe('Scenario 4: Stock Movement Velocity Audit (/reports/movement)', () => {
    it('computes stock in, stock out, and net change across 7-day range', () => {
      const summary = aggregateMovementReport(
        testMovements,
        testVariants,
        testProducts,
        { range: '7', productId: 'all', size: 'all' },
        refDate
      );

      const toyo1L = summary.rows.find((r) => r.variantId === 'var-toyo-1L');
      assert.ok(toyo1L);
      // In last 7 days: mov-1 (In: 20), mov-2 (Out: 5)
      assert.equal(toyo1L.stockIn, 20);
      assert.equal(toyo1L.stockOut, 5);
      assert.equal(toyo1L.netChange, 15);
      assert.equal(toyo1L.currentStock, 15);
    });

    it('expands movement history when range is 30 days', () => {
      const summary = aggregateMovementReport(
        testMovements,
        testVariants,
        testProducts,
        { range: '30', productId: 'all', size: 'all' },
        refDate
      );

      const toyo1L = summary.rows.find((r) => r.variantId === 'var-toyo-1L');
      assert.ok(toyo1L);
      // In 30 days: mov-1 (In: 20), mov-2 (Out: 5), mov-3 (In: 10) -> In: 30, Out: 5, Net: 25
      assert.equal(toyo1L.stockIn, 30);
      assert.equal(toyo1L.stockOut, 5);
      assert.equal(toyo1L.netChange, 25);
    });
  });

  describe('Scenario 5: Low Stock Shortfall Exceptions (/reports/low)', () => {
    it('isolates only variants at or below minimum stock and calculates shortfall units', () => {
      const summary = aggregateLowStockReport(
        testVariants,
        testProducts,
        { productId: 'all', size: 'all' }
      );

      // toyo-1L (stock 15, min 25 -> short by 10) and patis-gal (stock 5, min 10 -> short by 5)
      assert.equal(summary.rows.length, 2);

      const toyo1L = summary.rows.find((r) => r.variantId === 'var-toyo-1L');
      assert.ok(toyo1L);
      assert.equal(toyo1L.shortBy, 10);

      const patisGal = summary.rows.find((r) => r.variantId === 'var-patis-gal');
      assert.ok(patisGal);
      assert.equal(patisGal.shortBy, 5);

      assert.equal(summary.totalShortfallUnits, 15);
    });
  });

  describe('Scenario 6: Customer Balances Debt Audit (/reports/balances)', () => {
    it('identifies customers with outstanding balances sorted descending by debt amount', () => {
      const summary = aggregateCustomerBalancesReport(testCustomers, testSales);

      // cust-1 owes 180 (sale-001) + 50 (sale-003) = 230, unpaid sales = 2
      // cust-2 is fully paid (paid 100 / 100), owes 0 -> excluded
      // cust-3 has no sales -> excluded
      assert.equal(summary.rows.length, 1);
      assert.equal(summary.rows[0].customerId, 'cust-1');
      assert.equal(summary.rows[0].customerName, 'Mang Tonyo Carinderia');
      assert.equal(summary.rows[0].unpaidSalesCount, 2);
      assert.equal(summary.rows[0].balance, 230);

      assert.equal(summary.totalUnpaidSales, 2);
      assert.equal(summary.totalOutstandingBalance, 230);
    });
  });

  describe('Scenario 7: RFC 4180 CSV Export Generation', () => {
    it('escapes quotes and commas in CSV cells according to RFC 4180', () => {
      assert.equal(escapeCsvCell('Simple'), 'Simple');
      assert.equal(escapeCsvCell('Aling Nena, Sari-Sari'), '"Aling Nena, Sari-Sari"');
      assert.equal(escapeCsvCell('He said "Hello"'), '"He said ""Hello"""');
    });

    it('generates fully formatted CSV with headers, data rows, and summary footer', () => {
      const csv = generateCsvString({
        filename: 'test-report.csv',
        headers: ['Product', 'Size', 'In Stock', 'Cost Valuation'],
        rows: [
          ['Toyo', '1 L', 15, 675],
          ['Patis', '1 Gallon', 5, 900],
        ],
        footer: ['Total', '', 20, 1575],
      });

      const lines = csv.split('\r\n');
      assert.equal(lines.length, 4);
      assert.equal(lines[0], 'Product,Size,In Stock,Cost Valuation');
      assert.equal(lines[1], 'Toyo,1 L,15,675');
      assert.equal(lines[2], 'Patis,1 Gallon,5,900');
      assert.equal(lines[3], 'Total,,20,1575');
    });
  });
});
