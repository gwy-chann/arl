import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  ProductService,
  resetInMemoryProducts,
} from '../lib/products/product-service.ts';
import { notifyProductsUpdated } from '../lib/products/product-events.ts';

describe('Real-Time Product & Variant Catalog Synchronization', () => {
  beforeEach(() => {
    resetInMemoryProducts();
  });

  describe('Immediate Catalog Reflection', () => {
    test('adding a new variant to an existing product immediately reflects in catalog without refresh', async () => {
      const service = new ProductService();
      const initialProducts = await service.getProducts();
      const toyo = initialProducts.find((p) => p.name === 'Toyo');
      assert.ok(toyo, 'Toyo must exist');
      assert.equal(toyo.variants.length, 3, 'Toyo initially has 3 variants');

      // Add a 4th variant: "1 Container" (matching user screenshot)
      const updated = await service.updateProduct({
        id: toyo.id,
        name: toyo.name,
        category_id: toyo.category_id,
        variants: [
          ...toyo.variants.map((v) => ({
            id: v.id,
            size: v.size,
            cost_price: v.cost_price,
            selling_price: v.selling_price,
            min_stock_level: v.min_stock_level,
            opening_stock: v.stock_quantity,
          })),
          {
            size: '1 Container',
            cost_price: 250,
            selling_price: 300,
            min_stock_level: 5,
            opening_stock: 20,
          },
        ],
      });

      assert.equal(updated.variants.length, 4, 'Toyo must now have 4 variants');
      const containerVariant = updated.variants.find(
        (v) => v.size.toLowerCase() === '1 container'
      );
      assert.ok(containerVariant, 'New "1 Container" variant must exist');
      assert.equal(containerVariant.cost_price, 250);
      assert.equal(containerVariant.selling_price, 300);
      assert.equal(containerVariant.unit_profit, 50);

      // Verify that getProducts() returns the updated variant immediately
      const freshCatalog = await service.getProducts();
      const freshToyo = freshCatalog.find((p) => p.id === toyo.id);
      assert.ok(freshToyo);
      assert.equal(freshToyo.variants.length, 4);
    });

    test('adding a new product with multiple variants immediately reflects in getProducts()', async () => {
      const service = new ProductService();
      const created = await service.createProduct({
        name: 'Sukang Iloko',
        category_id: null,
        variants: [
          { size: '350 ml', cost_price: 15, selling_price: 22, min_stock_level: 10, opening_stock: 50 },
          { size: '1 L', cost_price: 35, selling_price: 50, min_stock_level: 15, opening_stock: 30 },
        ],
      });

      assert.ok(created);
      assert.equal(created.name, 'Sukang Iloko');
      assert.equal(created.variants.length, 2);

      const catalog = await service.getProducts();
      const retrieved = catalog.find((p) => p.name === 'Sukang Iloko');
      assert.ok(retrieved, 'Newly created product must be retrievable in catalog');
      assert.equal(retrieved.variants.length, 2);
    });

    test('notifyProductsUpdated runs safely in non-browser environment without throwing', () => {
      assert.doesNotThrow(() => {
        notifyProductsUpdated();
      });
    });

    test('updating existing variant prices immediately recalculates unit profit and reflects in catalog', async () => {
      const service = new ProductService();
      const catalog = await service.getProducts();
      const suka = catalog.find((p) => p.name === 'Suka');
      assert.ok(suka);

      const updatedSuka = await service.updateProduct({
        id: suka.id,
        name: suka.name,
        category_id: suka.category_id,
        variants: suka.variants.map((v) =>
          v.size === '1L'
            ? { ...v, cost_price: 32, selling_price: 45, min_stock_level: 25 }
            : { ...v }
        ),
      });

      assert.ok(updatedSuka);
      const updatedCatalog = await service.getProducts();
      const freshSuka = updatedCatalog.find((p) => p.id === suka.id);
      assert.ok(freshSuka);
      const updated1L = freshSuka.variants.find((v) => v.size === '1L');
      assert.ok(updated1L);
      assert.equal(updated1L.cost_price, 32);
      assert.equal(updated1L.selling_price, 45);
      assert.equal(updated1L.unit_profit, 13);
    });
  });
});
