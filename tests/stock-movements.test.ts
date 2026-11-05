/**
 * Automated Unit & Acceptance Tests: Stock-In & Stock-Out Ledger with Movement Audit
 * Feature: ARL-13 (008-stock-movement-ledger)
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  stockMovementInputSchema,
  formatSignedQuantity,
  formatMovementDisplayNote,
  formatMovementVariantLabel,
  formatStockInSuccessToast,
  formatStockOutSuccessToast,
  formatInsufficientStockToast,
} from '../lib/inventory/stock-contracts.ts';
import {
  StockService,
  resetInMemoryMovements,
} from '../lib/inventory/stock-service.ts';
import { ProductService } from '../lib/products/product-service.ts';

describe('Feature ARL-13: Stock-In & Stock-Out Ledger with Movement Audit', () => {
  let stockService: StockService;
  let productService: ProductService;

  beforeEach(() => {
    resetInMemoryMovements();
    stockService = new StockService();
    productService = new ProductService();
  });

  describe('Validation & Formatters', () => {
    test('stockMovementInputSchema validates valid stock in input', () => {
      const parsed = stockMovementInputSchema.parse({
        variant_id: 'toyo-1L',
        movement_type: 'In',
        quantity: 24,
        reason: 'Restock from warehouse',
        note: 'DR #8841',
      });

      assert.equal(parsed.variant_id, 'toyo-1L');
      assert.equal(parsed.movement_type, 'In');
      assert.equal(parsed.quantity, 24);
      assert.equal(parsed.reason, 'Restock from warehouse');
      assert.equal(parsed.note, 'DR #8841');
    });

    test('stockMovementInputSchema rejects non-positive or non-integer quantities', () => {
      assert.throws(() => {
        stockMovementInputSchema.parse({
          variant_id: 'toyo-1L',
          movement_type: 'In',
          quantity: 0,
          reason: 'Restock from warehouse',
        });
      }, /Quantity must be at least 1/);

      assert.throws(() => {
        stockMovementInputSchema.parse({
          variant_id: 'toyo-1L',
          movement_type: 'In',
          quantity: -5,
          reason: 'Restock from warehouse',
        });
      }, /Quantity must be at least 1/);

      assert.throws(() => {
        stockMovementInputSchema.parse({
          variant_id: 'toyo-1L',
          movement_type: 'In',
          quantity: 2.5,
          reason: 'Restock from warehouse',
        });
      }, /Quantity must be an integer/);
    });

    test('stockMovementInputSchema defaults optional note to empty string', () => {
      const parsed = stockMovementInputSchema.parse({
        variant_id: 'toyo-1L',
        movement_type: 'In',
        quantity: 10,
        reason: 'Restock from warehouse',
      });
      assert.equal(parsed.note, '');
    });

    test('formatting helpers produce exact strings matching mockup', () => {
      assert.equal(formatSignedQuantity('In', 24), '+24');
      assert.equal(formatSignedQuantity('Out', 1), '-1');
      assert.equal(formatSignedQuantity('Sale', 6), '-6');

      assert.equal(
        formatMovementDisplayNote('Restock from warehouse', 'DR #8841'),
        'Restock from warehouse: DR #8841'
      );
      assert.equal(
        formatMovementDisplayNote('Restock from warehouse', ''),
        'Restock from warehouse'
      );

      assert.equal(
        formatMovementVariantLabel('Toyo', '1 L'),
        'Toyo - 1 L'
      );

      assert.equal(
        formatStockInSuccessToast('Toyo - 1 L', 82),
        'Stock in saved: Toyo - 1 L now 82'
      );
      assert.equal(
        formatStockOutSuccessToast('Suka - 1 gal', 5),
        'Stock out saved: Suka - 1 gal now 5'
      );
      assert.equal(
        formatInsufficientStockToast(14),
        'Only 14 in stock'
      );
    });
  });

  describe('Scenario 1: Warehouse delivery stock in', () => {
    test('Toyo 1L stock is incremented from 58 to 82 bottles with toast confirmation', async () => {
      // Given Toyo 1L currently has 58 bottles in stock
      const initialVariant = await productService.getVariantById('toyo-1L');
      assert.ok(initialVariant, 'Toyo 1L variant should exist');
      assert.equal(initialVariant.variant.stock_quantity, 58, 'Initial Toyo 1L stock must be 58');

      // When the admin records Stock In of 24 units with reason "Restock from warehouse" and delivery note "DR #8841"
      const result = await stockService.recordMovement({
        variant_id: 'toyo-1L',
        movement_type: 'In',
        quantity: 24,
        reason: 'Restock from warehouse',
        note: 'DR #8841',
      });

      // Then a stock_movements row is created with type "In"
      assert.equal(result.success, true);
      assert.ok(result.movement);
      assert.equal(result.movement.movement_type, 'In');
      assert.equal(result.movement.quantity, 24);
      assert.equal(result.movement.reason, 'Restock from warehouse');
      assert.equal(result.movement.note, 'DR #8841');

      // And Toyo 1L stock is incremented to 82 bottles
      assert.equal(result.new_stock, 82);
      const updatedVariant = await productService.getVariantById('toyo-1L');
      assert.equal(updatedVariant?.variant.stock_quantity, 82);

      // And a toast confirms "Stock in saved: Toyo - 1 L now 82"
      assert.equal(result.toastMessage, 'Stock in saved: Toyo - 1 L now 82');
    });
  });

  describe('Scenario 2: Damage stock out', () => {
    test('Suka 1 gal stock is decremented from 6 to 5 bottles with toast confirmation', async () => {
      // Given Suka 1 gal has 6 bottles in stock
      const initialVariant = await productService.getVariantById('suka-gal');
      assert.ok(initialVariant, 'Suka 1 gal variant should exist');
      assert.equal(initialVariant.variant.stock_quantity, 6, 'Initial Suka 1 gal stock must be 6');

      // When the admin records Stock Out of 1 unit with reason "Damaged or spilled" and note "Cracked cap"
      const result = await stockService.recordMovement({
        variant_id: 'suka-gal',
        movement_type: 'Out',
        quantity: 1,
        reason: 'Damaged or spilled',
        note: 'Cracked cap',
      });

      // Then a stock_movements row is created with type "Out"
      assert.equal(result.success, true);
      assert.ok(result.movement);
      assert.equal(result.movement.movement_type, 'Out');
      assert.equal(result.movement.quantity, 1);
      assert.equal(result.movement.reason, 'Damaged or spilled');
      assert.equal(result.movement.note, 'Cracked cap');

      // And Suka 1 gal stock is decremented to 5 bottles
      assert.equal(result.new_stock, 5);
      const updatedVariant = await productService.getVariantById('suka-gal');
      assert.equal(updatedVariant?.variant.stock_quantity, 5);

      // And a toast confirms "Stock out saved: Suka - 1 gal now 5"
      assert.equal(result.toastMessage, 'Stock out saved: Suka - 1 gal now 5');
    });
  });

  describe('Scenario 3: Prevent stock out exceeding available stock', () => {
    test('blocks submission with toast "Only 14 in stock" and executes no database change', async () => {
      // Given Patis 1 gal has only 14 bottles in stock
      const initialVariant = await productService.getVariantById('patis-gal');
      assert.ok(initialVariant, 'Patis 1 gal variant should exist');
      assert.equal(initialVariant.variant.stock_quantity, 14, 'Initial Patis 1 gal stock must be 14');

      const initialMovements = await stockService.listMovements();
      const initialMovementsCount = initialMovements.length;

      // When the admin attempts to record Stock Out of 15 bottles
      const result = await stockService.recordMovement({
        variant_id: 'patis-gal',
        movement_type: 'Out',
        quantity: 15,
        reason: 'Damaged or spilled',
        note: 'Attempted overdraw',
      });

      // Then the system blocks submission with error toast "Only 14 in stock"
      assert.equal(result.success, false);
      assert.equal(result.error, 'Only 14 in stock');

      // And no database change is executed (stock remains 14)
      const afterVariant = await productService.getVariantById('patis-gal');
      assert.equal(afterVariant?.variant.stock_quantity, 14);

      const afterMovements = await stockService.listMovements();
      assert.equal(afterMovements.length, initialMovementsCount);
    });

    test('allows stock out when quantity exactly equals current available stock', async () => {
      const result = await stockService.recordMovement({
        variant_id: 'patis-gal',
        movement_type: 'Out',
        quantity: 14,
        reason: 'Correction',
      });

      assert.equal(result.success, true);
      assert.equal(result.new_stock, 0);

      const afterVariant = await productService.getVariantById('patis-gal');
      assert.equal(afterVariant?.variant.stock_quantity, 0);
    });
  });

  describe('Scenario 4: Movement history filtering', () => {
    test('selecting "In" from type filter displays only Stock In movements with positive signed quantities', async () => {
      // Given historical movements of types In, Out, and Sale
      const inMovements = await stockService.listMovements({ type: 'In' });

      assert.ok(inMovements.length > 0, 'Should have inbound movements');
      for (const m of inMovements) {
        assert.equal(m.movement_type, 'In');
        assert.ok(
          m.signed_quantity.startsWith('+'),
          `Signed quantity "${m.signed_quantity}" must begin with "+"`
        );
      }
    });

    test('selecting "Out" from type filter displays outbound and sale movements with negative signed quantities', async () => {
      const outMovements = await stockService.listMovements({ type: 'Out' });

      assert.ok(outMovements.length > 0, 'Should have outbound movements');
      for (const m of outMovements) {
        assert.ok(m.movement_type === 'Out' || m.movement_type === 'Sale');
        assert.ok(
          m.signed_quantity.startsWith('-'),
          `Signed quantity "${m.signed_quantity}" must begin with "-"`
        );
      }
    });

    test('selecting "All movements" returns complete ledger sorted newest first', async () => {
      const allMovements = await stockService.listMovements();
      assert.ok(allMovements.length >= 12, 'Baseline movements must be present');

      for (let i = 0; i < allMovements.length - 1; i++) {
        const t1 = new Date(allMovements[i].created_at).getTime();
        const t2 = new Date(allMovements[i + 1].created_at).getTime();
        assert.ok(t1 >= t2, 'Movements must be sorted chronologically descending');
      }
    });

    test('search query filters movements across product name and notes', async () => {
      const results = await stockService.listMovements({ search: 'cracked cap' });
      assert.equal(results.length, 1);
      assert.equal(results[0].product_name, 'Suka');
      assert.ok(results[0].display_note.includes('cracked cap'));

      const toyoResults = await stockService.listMovements({ search: 'toyo' });
      assert.ok(toyoResults.length >= 3);
      for (const r of toyoResults) {
        assert.equal(r.product_name, 'Toyo');
      }
    });
  });

  describe('Form Selectors & Recent Movements', () => {
    test('listVariantsForStock returns formatted variant selector labels', async () => {
      const options = await stockService.listVariantsForStock();
      assert.equal(options.length, 9, 'ARLQ has 9 variants (3 products x 3 sizes)');

      const toyo1L = options.find((o) => o.id === 'toyo-1L');
      assert.ok(toyo1L);
      assert.equal(toyo1L.selector_label, 'Toyo - 1 L (58 in stock)');
    });

    test('getRecentMovements returns at most 5 latest movements excluding sales', async () => {
      const recentIn = await stockService.getRecentMovements('In', 5);
      assert.ok(recentIn.length <= 5);
      for (const m of recentIn) {
        assert.equal(m.movement_type, 'In');
      }

      const recentOut = await stockService.getRecentMovements('Out', 5);
      assert.ok(recentOut.length <= 5);
      for (const m of recentOut) {
        assert.equal(m.movement_type, 'Out');
        assert.ok(!m.note.startsWith('Sale'));
      }
    });
  });
});
