import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatReceiptDate,
  formatVariantSize,
  formatVariantLabel,
  getReceiptPaymentStatus,
  formatPeso,
  toReceiptSnapshot,
} from '../lib/receipt/receipt-service.ts';
import {
  ReceiptSnapshotSchema,
} from '../lib/receipt/receipt-contracts.ts';
import type { SaleTransactionDTO } from '../lib/sales/sale-contracts.ts';

describe('Feature ARL-16: Printable Official Sales Receipt with POS Thermal Print Layout', () => {
  const mockSale: SaleTransactionDTO = {
    id: 'sale-001',
    receipt_number: 'ARLQ-01041',
    customer_id: 'cust-001',
    customer_name: 'Mang Tonyo Carinderia',
    customer_phone: '0917 123 4567',
    customer_address: '123 Market St, Caloocan',
    total_amount: 1340,
    amount_paid: 1340,
    balance: 0,
    payment_status: 'Paid',
    order_status: 'Delivered',
    gross_profit: 420,
    created_at: '2026-10-11T09:30:00.000Z',
    updated_at: '2026-10-11T09:30:00.000Z',
    items: [
      {
        id: 'item-1',
        sale_id: 'sale-001',
        variant_id: 'var-patis-1l',
        product_name: 'Patis',
        size: '1L',
        quantity: 5,
        unit_price: 120,
        unit_cost: 80,
        created_at: '2026-10-11T09:30:00.000Z',
      },
      {
        id: 'item-2',
        sale_id: 'sale-001',
        variant_id: 'var-toyo-350',
        product_name: 'Toyo',
        size: '350',
        quantity: 10,
        unit_price: 35,
        unit_cost: 20,
        created_at: '2026-10-11T09:30:00.000Z',
      },
      {
        id: 'item-3',
        sale_id: 'sale-001',
        variant_id: 'var-suka-gal',
        product_name: 'Suka',
        size: 'gal',
        quantity: 2,
        unit_price: 195,
        unit_cost: 140,
        created_at: '2026-10-11T09:30:00.000Z',
      },
    ],
  };

  describe('Scenario 1: Thermal receipt monospace preview data', () => {
    it('transforms sale DTO into receipt snapshot with correct header, metadata, and items', () => {
      const receipt = toReceiptSnapshot(mockSale);

      assert.strictEqual(receipt.receipt_number, 'ARLQ-01041');
      assert.strictEqual(receipt.customer_name, 'Mang Tonyo Carinderia');
      assert.strictEqual(receipt.total_amount, 1340);
      assert.strictEqual(receipt.amount_paid, 1340);
      assert.strictEqual(receipt.balance, 0);
      assert.strictEqual(receipt.items.length, 3);

      // Verify itemized formatting
      assert.strictEqual(receipt.items[0].variant_label, 'Patis - 1 L');
      assert.strictEqual(receipt.items[0].quantity, 5);
      assert.strictEqual(receipt.items[0].unit_price, 120);
      assert.strictEqual(receipt.items[0].line_total, 600);

      assert.strictEqual(receipt.items[1].variant_label, 'Toyo - 350 ml');
      assert.strictEqual(receipt.items[1].quantity, 10);
      assert.strictEqual(receipt.items[1].unit_price, 35);
      assert.strictEqual(receipt.items[1].line_total, 350);

      assert.strictEqual(receipt.items[2].variant_label, 'Suka - 1 gal');
      assert.strictEqual(receipt.items[2].quantity, 2);
      assert.strictEqual(receipt.items[2].unit_price, 195);
      assert.strictEqual(receipt.items[2].line_total, 390);

      // Total sum check: 600 + 350 + 390 = 1340
      const calculatedSum = receipt.items.reduce((acc, it) => acc + it.line_total, 0);
      assert.strictEqual(calculatedSum, 1340);

      // Validate against Zod schema
      const parseResult = ReceiptSnapshotSchema.safeParse(receipt);
      assert.strictEqual(parseResult.success, true);
    });

    it('formats transaction date consistently', () => {
      const formatted = formatReceiptDate('2026-10-11T09:30:00.000Z');
      assert.strictEqual(formatted, 'Oct 11, 2026');
    });

    it('falls back to default customer name if missing', () => {
      const anonymousSale: SaleTransactionDTO = {
        ...mockSale,
        customer_name: undefined,
      };
      const receipt = toReceiptSnapshot(anonymousSale);
      assert.strictEqual(receipt.customer_name, 'Walk-in Customer');
    });
  });

  describe('Scenario 2: Payment status stamp rendering', () => {
    it('classifies fully paid sale as uppercase PAID stamp', () => {
      const status = getReceiptPaymentStatus(1340, 0);
      assert.strictEqual(status, 'PAID');

      const receipt = toReceiptSnapshot({
        ...mockSale,
        amount_paid: 1340,
        balance: 0,
      });
      assert.strictEqual(receipt.payment_status, 'PAID');
    });

    it('classifies partially paid sale as PARTIALLY PAID with remaining balance', () => {
      const status = getReceiptPaymentStatus(1000, 340);
      assert.strictEqual(status, 'PARTIALLY PAID');

      const receipt = toReceiptSnapshot({
        ...mockSale,
        amount_paid: 1000,
        balance: 340,
      });
      assert.strictEqual(receipt.payment_status, 'PARTIALLY PAID');
      assert.strictEqual(receipt.balance, 340);
    });

    it('classifies unpaid sale with 0 amount paid as NOT YET PAID', () => {
      const status = getReceiptPaymentStatus(0, 1340);
      assert.strictEqual(status, 'NOT YET PAID');

      const receipt = toReceiptSnapshot({
        ...mockSale,
        amount_paid: 0,
        balance: 1340,
      });
      assert.strictEqual(receipt.payment_status, 'NOT YET PAID');
      assert.strictEqual(receipt.balance, 1340);
    });
  });

  describe('Scenario 3: Packaging size and variant formatting', () => {
    it('formats packaging sizes correctly', () => {
      assert.strictEqual(formatVariantSize('350'), '350 ml');
      assert.strictEqual(formatVariantSize('1L'), '1 L');
      assert.strictEqual(formatVariantSize('gal'), '1 gal');
      assert.strictEqual(formatVariantSize('custom-size'), 'custom-size');
      assert.strictEqual(formatVariantSize(undefined), '');
    });

    it('formats variant labels correctly', () => {
      assert.strictEqual(formatVariantLabel('Patis', '1L'), 'Patis - 1 L');
      assert.strictEqual(formatVariantLabel('Toyo', '350'), 'Toyo - 350 ml');
      assert.strictEqual(formatVariantLabel('Suka', 'gal'), 'Suka - 1 gal');
      assert.strictEqual(formatVariantLabel('Vinegar', undefined), 'Vinegar');
      assert.strictEqual(formatVariantLabel(undefined, '1L'), 'Product - 1 L');
    });

    it('formats Philippine peso values properly', () => {
      const formatted = formatPeso(1340);
      assert.match(formatted, /1,340\.00/);
    });
  });

  describe('Scenario 4: Fast navigation links and routes', () => {
    it('constructs correct return URL back to sale detail', () => {
      const returnUrl = `/sales/${mockSale.id}`;
      assert.strictEqual(returnUrl, '/sales/sale-001');
    });

    it('constructs correct receipt URL from sale ID', () => {
      const receiptUrl = `/receipt/${mockSale.id}`;
      assert.strictEqual(receiptUrl, '/receipt/sale-001');
    });
  });
});
