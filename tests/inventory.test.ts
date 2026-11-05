import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCapacityMeter,
  formatPackagingSize,
} from '../lib/inventory/capacity-meter.ts';
import {
  InventoryService,
  resetInMemoryInventory,
  seedSampleInventory,
} from '../lib/services/inventory-service.ts';

describe('Feature ARL-12: Live Stock Inventory Monitor & Capacity Level Meters', () => {
  describe('Capacity Meter Calculations & Threshold Logic', () => {
    test('Scenario 1: Low stock level detection (Patis 350ml: min 36, stock 21)', () => {
      const evaluation = computeCapacityMeter(21, 36);

      assert.equal(evaluation.status, 'low-stock');
      assert.equal(evaluation.statusLabel, 'Low stock');
      assert.equal(evaluation.statusVariant, 'warn');
      assert.equal(evaluation.isLow, true);
      assert.equal(evaluation.shortBy, 15);
      // Formula: 21 / (36 * 2.5) * 100 = 21 / 90 * 100 = 23.33 -> 23%
      assert.equal(evaluation.percentage, 23);
    });

    test('Scenario 2: Out of stock warning (Suka 1 gal: min 12, stock 0)', () => {
      const evaluation = computeCapacityMeter(0, 12);

      assert.equal(evaluation.status, 'out-of-stock');
      assert.equal(evaluation.statusLabel, 'Out of stock');
      assert.equal(evaluation.statusVariant, 'bad');
      assert.equal(evaluation.isLow, true);
      assert.equal(evaluation.shortBy, 12);
      assert.equal(evaluation.percentage, 0);
    });

    test('Getting low status: stock is above min but within 1.4x of min', () => {
      // min = 30, stock = 35 (35 <= 30 * 1.4 = 42)
      const evaluation = computeCapacityMeter(35, 30);

      assert.equal(evaluation.status, 'getting-low');
      assert.equal(evaluation.statusLabel, 'Getting low');
      assert.equal(evaluation.statusVariant, 'warn');
      assert.equal(evaluation.isLow, false);
      assert.equal(evaluation.shortBy, 0);
      // 35 / (30 * 2.5) * 100 = 35 / 75 * 100 = 46.66 -> 47%
      assert.equal(evaluation.percentage, 47);
    });

    test('Healthy in-stock status: stock is well above 1.4x of min', () => {
      // min = 48, stock = 96
      const evaluation = computeCapacityMeter(96, 48);

      assert.equal(evaluation.status, 'in-stock');
      assert.equal(evaluation.statusLabel, 'In stock');
      assert.equal(evaluation.statusVariant, 'ok');
      assert.equal(evaluation.isLow, false);
      assert.equal(evaluation.shortBy, 0);
      // 96 / (48 * 2.5) * 100 = 96 / 120 * 100 = 80%
      assert.equal(evaluation.percentage, 80);
    });

    test('Caps percentage at 100% when stock exceeds standard 2.5x capacity', () => {
      const evaluation = computeCapacityMeter(500, 20);

      assert.equal(evaluation.percentage, 100);
      assert.equal(evaluation.status, 'in-stock');
      assert.equal(evaluation.isLow, false);
      assert.equal(evaluation.shortBy, 0);
    });

    test('Handles min = 0 gracefully without dividing by zero', () => {
      const withStock = computeCapacityMeter(50, 0);
      assert.equal(withStock.percentage, 100);
      assert.equal(withStock.status, 'in-stock');
      assert.equal(withStock.shortBy, 0);

      const zeroStock = computeCapacityMeter(0, 0);
      assert.equal(zeroStock.percentage, 0);
      assert.equal(zeroStock.status, 'out-of-stock');
      assert.equal(zeroStock.shortBy, 0);
    });
  });

  describe('Packaging Size Formatter', () => {
    test('formats standard packaging sizes', () => {
      assert.equal(formatPackagingSize('350'), '350 ml');
      assert.equal(formatPackagingSize('1L'), '1 L');
      assert.equal(formatPackagingSize('gal'), '1 gal');
    });

    test('passes through unknown sizes without throwing', () => {
      assert.equal(formatPackagingSize('custom'), 'custom');
    });
  });

  describe('Inventory Service Layer', () => {
    let service: InventoryService;

    beforeEach(() => {
      resetInMemoryInventory();
      service = new InventoryService();
      seedSampleInventory();
    });

    test('retrieves all 9 variants across Toyo, Suka, and Patis', async () => {
      const items = await service.getInventoryVariants();
      assert.equal(items.length, 9);

      const productNames = [...new Set(items.map((i) => i.productName))].sort();
      assert.deepEqual(productNames, ['Patis', 'Suka', 'Toyo']);

      for (const item of items) {
        assert.ok(['350 ml', '1 L', '1 gal'].includes(item.sizeLabel));
        assert.ok(item.stockQuantity >= 0);
        assert.ok(item.minStockLevel >= 0);
      }
    });

    test('Scenario 1 Verification: filters low stock variants and calculates shortBy', async () => {
      const lowVariants = await service.getLowStockVariants();

      // Based on standard seed:
      // Suka 1 gal has stock 6, min 12 -> shortBy 6
      // Patis 350ml has stock 21, min 36 -> shortBy 15
      assert.ok(lowVariants.length >= 2);

      const patis350 = lowVariants.find(
        (v) => v.productName === 'Patis' && v.size === '350'
      );
      assert.ok(patis350);
      assert.equal(patis350?.stockQuantity, 21);
      assert.equal(patis350?.minStockLevel, 36);

      const sukaGal = lowVariants.find(
        (v) => v.productName === 'Suka' && v.size === 'gal'
      );
      assert.ok(sukaGal);
      assert.equal(sukaGal?.stockQuantity, 6);
      assert.equal(sukaGal?.minStockLevel, 12);
    });

    test('Scenario 3 Verification: updates variant stock in real-time simulation', async () => {
      const itemsBefore = await service.getInventoryVariants();
      const toyo1L = itemsBefore.find(
        (v) => v.productName === 'Toyo' && v.size === '1L'
      );
      assert.ok(toyo1L);
      assert.equal(toyo1L?.stockQuantity, 58);

      // Simulate a sale deducting 2 units: 58 -> 56
      const updated = await service.updateVariantStock(toyo1L!.id, 56);
      assert.equal(updated.stockQuantity, 56);

      const itemsAfter = await service.getInventoryVariants();
      const toyo1LAfter = itemsAfter.find((v) => v.id === toyo1L!.id);
      assert.equal(toyo1LAfter?.stockQuantity, 56);
    });

    test('Scenario 5 Verification: returns empty array when all stock is healthy', async () => {
      // Set all variants above minimum
      const all = await service.getInventoryVariants();
      for (const item of all) {
        await service.updateVariantStock(item.id, item.minStockLevel + 10);
      }

      const lowVariants = await service.getLowStockVariants();
      assert.equal(lowVariants.length, 0);
    });
  });
});
