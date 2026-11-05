import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSaleSummary,
  formatStockNote,
  generateNextReceiptNumber,
  SaleService,
  resetInMemorySales,
} from '../lib/sales/sale-service.ts';
import {
  ProductService,
  resetInMemoryProducts,
} from '../lib/products/product-service.ts';
import {
  resetMemoryCustomerStore,
  getCustomerById,
} from '../lib/customers/customer-service.ts';
import type { SaleLineInput } from '../lib/sales/sale-contracts.ts';

describe('Feature ARL-14: POS-Style Multi-Line Checkout Wizard with Stock Validation', () => {
  beforeEach(() => {
    resetInMemoryProducts();
    resetMemoryCustomerStore();
    resetInMemorySales();
  });

  describe('Scenario 1: Multi-line sale with full payment', () => {
    it('accurately computes grand total ₱560, profit ₱115, remaining balance ₱0, decrements stock and allocates receipt', async () => {
      const productService = new ProductService(null);
      const saleService = new SaleService(null);

      // Verify baseline stock
      const patisMatch = await productService.getVariantById('patis-gal');
      const toyoMatch = await productService.getVariantById('toyo-gal');
      assert.ok(patisMatch);
      assert.ok(toyoMatch);
      assert.equal(patisMatch.variant.stock_quantity, 14);
      assert.equal(toyoMatch.variant.stock_quantity, 17);

      const lines: SaleLineInput[] = [
        {
          productId: 'prod-patis',
          variantId: 'patis-gal',
          size: 'gal',
          quantity: 2,
          unitPrice: 200,
          unitCost: 160,
        },
        {
          productId: 'prod-toyo',
          variantId: 'toyo-gal',
          size: 'gal',
          quantity: 1,
          unitPrice: 160,
          unitCost: 125,
        },
      ];

      // Pure calculation summary test
      const summary = calculateSaleSummary(lines, 'Paid', 0, 'k2', {
        'patis-gal': 14,
        'toyo-gal': 17,
      });

      assert.equal(summary.totalItems, 3);
      assert.equal(summary.grandTotal, 560.0);
      assert.equal(summary.grossProfit, 115.0); // (200-160)*2 + (160-125)*1 = 40*2 + 35 = 115
      assert.equal(summary.amountPaid, 560.0);
      assert.equal(summary.remainingBalance, 0.0);
      assert.equal(summary.hasStockError, false);
      assert.equal(summary.isValid, true);

      // Execute atomic transaction
      const result = await saleService.createSaleTransaction({
        customerId: 'k2', // Mang Tonyo
        lines,
        paymentStatus: 'Paid',
        amountPaid: 560,
        orderStatus: 'Delivered',
      });

      assert.equal(result.success, true);
      assert.ok(result.sale);
      assert.match(result.sale.receipt_number, /^ARLQ-\d{5}$/);
      assert.equal(result.sale.total_amount, 560);
      assert.equal(result.sale.amount_paid, 560);
      assert.equal(result.sale.balance, 0);
      assert.equal(result.sale.gross_profit, 115);

      // Check atomic stock decrement: Patis -2 (14 -> 12), Toyo -1 (17 -> 16)
      const updatedPatis = await productService.getVariantById('patis-gal');
      const updatedToyo = await productService.getVariantById('toyo-gal');
      assert.equal(updatedPatis?.variant.stock_quantity, 12);
      assert.equal(updatedToyo?.variant.stock_quantity, 16);
    });
  });

  describe('Scenario 2: Partial payment with debt registration', () => {
    it('computes ₱700 remaining balance and increases customer debt balance by ₱700 upon saving', async () => {
      const saleService = new SaleService(null);

      // Retrieve Mang Tonyo initial debt
      const initialCust = await getCustomerById('k2');
      assert.ok(initialCust);
      const initialDebt = initialCust.debt_balance;

      const lines: SaleLineInput[] = [
        {
          productId: 'prod-toyo',
          variantId: 'toyo-gal',
          size: 'gal',
          quantity: 6, // 6 * 160 = 960
          unitPrice: 160,
          unitCost: 125,
        },
        {
          productId: 'prod-suka',
          variantId: 'suka-1L',
          size: '1L',
          quantity: 5, // 5 * 42 = 210, let's adjust to reach exactly 1200 or test 1200
          unitPrice: 48,
          unitCost: 30,
        },
      ];
      // Total: 6 * 160 = 960 + 5 * 48 = 240 -> total = 1200.00!
      const summary = calculateSaleSummary(lines, 'Partially Paid', 500, 'k2', {
        'toyo-gal': 17,
        'suka-1L': 34,
      });

      assert.equal(summary.grandTotal, 1200.0);
      assert.equal(summary.amountPaid, 500.0);
      assert.equal(summary.remainingBalance, 700.0);
      assert.equal(summary.isValid, true);

      // Save sale
      const result = await saleService.createSaleTransaction({
        customerId: 'k2',
        lines,
        paymentStatus: 'Partially Paid',
        amountPaid: 500,
        orderStatus: 'Pending',
      });

      assert.equal(result.success, true);
      assert.equal(result.sale?.balance, 700);

      // Check customer debt increased by 700
      const updatedCust = await getCustomerById('k2');
      assert.ok(updatedCust);
      assert.equal(updatedCust.debt_balance, initialDebt + 700);
    });
  });

  describe('Scenario 3: Real-time over-stock warning', () => {
    it('flags "Only 6 in stock. Lower the quantity." in red and disables saving when quantity exceeds stock', () => {
      const lines: SaleLineInput[] = [
        {
          productId: 'prod-suka',
          variantId: 'suka-gal',
          size: 'gal',
          quantity: 7,
          unitPrice: 135,
          unitCost: 100,
        },
      ];

      const note = formatStockNote(6, 7, 135);
      assert.equal(note.isError, true);
      assert.equal(note.message, 'Only 6 in stock. Lower the quantity.');

      const summary = calculateSaleSummary(lines, 'Paid', 0, 'k1', {
        'suka-gal': 6,
      });

      assert.equal(summary.hasStockError, true);
      assert.equal(summary.isValid, false);
      assert.equal(summary.lineErrors[0], 'Only 6 in stock. Lower the quantity.');
    });

    it('displays unit price and valid remaining stock when quantity is within bounds', () => {
      const note = formatStockNote(6, 4, 135);
      assert.equal(note.isError, false);
      assert.equal(note.message, 'Unit price ₱135.00 · 2 will remain after this sale');
    });

    it('detects cumulative over-stock across duplicate line items for the same variant', () => {
      const lines: SaleLineInput[] = [
        {
          productId: 'prod-suka',
          variantId: 'suka-gal',
          size: 'gal',
          quantity: 4,
          unitPrice: 135,
          unitCost: 100,
        },
        {
          productId: 'prod-suka',
          variantId: 'suka-gal',
          size: 'gal',
          quantity: 3, // 4 + 3 = 7, but stock is 6!
          unitPrice: 135,
          unitCost: 100,
        },
      ];

      const summary = calculateSaleSummary(lines, 'Paid', 0, 'k1', {
        'suka-gal': 6,
      });

      assert.equal(summary.hasStockError, true);
      assert.equal(summary.isValid, false);
    });
  });

  describe('Scenario 4: Sequential receipt numbering & edge cases', () => {
    it('generates next sequential receipt number continuing sequence from seed data', async () => {
      const nextNo = await generateNextReceiptNumber(null);
      assert.equal(nextNo, 'ARLQ-01064');
    });

    it('rejects checkout without a selected customer', () => {
      const lines: SaleLineInput[] = [
        {
          productId: 'prod-toyo',
          variantId: 'toyo-1L',
          size: '1L',
          quantity: 1,
          unitPrice: 50,
          unitCost: 38,
        },
      ];

      const summary = calculateSaleSummary(lines, 'Paid', 0, '', {
        'toyo-1L': 58,
      });

      assert.equal(summary.isValid, false);
    });

    it('calculates full grand total as remaining balance for Not Yet Paid status', () => {
      const lines: SaleLineInput[] = [
        {
          productId: 'prod-toyo',
          variantId: 'toyo-1L',
          size: '1L',
          quantity: 3,
          unitPrice: 50,
          unitCost: 38,
        },
      ];

      const summary = calculateSaleSummary(lines, 'Not Yet Paid', 0, 'k1', {
        'toyo-1L': 58,
      });

      assert.equal(summary.grandTotal, 150);
      assert.equal(summary.amountPaid, 0);
      assert.equal(summary.remainingBalance, 150);
      assert.equal(summary.isValid, true);
    });
  });
});
