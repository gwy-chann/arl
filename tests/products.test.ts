import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getSizeLabel,
  formatPeso,
  computeUnitProfit,
  variantInputSchema,
  productInputSchema,
  getDeleteProductPrompt,
} from '../specs/006-multi-variant-product-catalog/contracts/product-contracts.ts';
import {
  ProductService,
  resetInMemoryProducts,
  type CreateProductInput,
} from '../lib/products/product-service.ts';

describe('Feature ARL-8: Multi-Variant Product Catalog & Pricing Engine', () => {
  beforeEach(() => {
    resetInMemoryProducts();
  });

  describe('Scenario 1: Multi-variant product catalog creation', () => {
    test('atomically creates 1 product record and 3 product_variants records', async () => {
      const service = new ProductService();
      const input: CreateProductInput = {
        name: 'Toyo Special',
        category_id: 'cat-1',
        variants: [
          {
            size: '350',
            cost_price: 14.0,
            selling_price: 20.0,
            min_stock_level: 48,
            opening_stock: 96,
          },
          {
            size: '1L',
            cost_price: 38.0,
            selling_price: 50.0,
            min_stock_level: 30,
            opening_stock: 58,
          },
          {
            size: 'gal',
            cost_price: 125.0,
            selling_price: 160.0,
            min_stock_level: 12,
            opening_stock: 17,
          },
        ],
      };

      const product = await service.createProduct(input);

      assert.ok(product.id, 'Product must have an ID');
      assert.equal(product.name, 'Toyo Special');
      assert.equal(product.category_id, 'cat-1');
      assert.equal(product.variants.length, 3, 'Must create exactly 3 variants');

      const var350 = product.variants.find((v) => v.size === '350');
      const var1L = product.variants.find((v) => v.size === '1L');
      const varGal = product.variants.find((v) => v.size === 'gal');

      assert.ok(var350, '350ml variant must exist');
      assert.equal(var350.cost_price, 14.0);
      assert.equal(var350.selling_price, 20.0);
      assert.equal(var350.stock_quantity, 96);
      assert.equal(var350.min_stock_level, 48);
      assert.equal(var350.unit_profit, 6.0);

      assert.ok(var1L, '1L variant must exist');
      assert.equal(var1L.cost_price, 38.0);
      assert.equal(var1L.selling_price, 50.0);
      assert.equal(var1L.stock_quantity, 58);
      assert.equal(var1L.unit_profit, 12.0);

      assert.ok(varGal, 'gal variant must exist');
      assert.equal(varGal.cost_price, 125.0);
      assert.equal(varGal.selling_price, 160.0);
      assert.equal(varGal.stock_quantity, 17);
      assert.equal(varGal.unit_profit, 35.0);
    });

    test('retrieves created product in getProducts() catalog list', async () => {
      const service = new ProductService();
      const initial = await service.getProducts();
      assert.equal(initial.length, 3, 'Baseline has 3 canonical products');

      await service.createProduct({
        name: 'Extra Soy Sauce',
        category_id: null,
        variants: [
          { size: '350', cost_price: 10, selling_price: 15, min_stock_level: 20 },
          { size: '1L', cost_price: 25, selling_price: 35, min_stock_level: 10 },
          { size: 'gal', cost_price: 80, selling_price: 110, min_stock_level: 5 },
        ],
      });

      const updated = await service.getProducts();
      assert.equal(updated.length, 4, 'Catalog now contains 4 products');
      const found = updated.find((p) => p.name === 'Extra Soy Sauce');
      assert.ok(found);
      assert.equal(found.variants.length, 3);
    });
  });

  describe('Scenario 2: Automatic unit profit computation', () => {
    test('calculates unit profit as (selling_price - cost_price)', () => {
      const cost = 38.0;
      const price = 50.0;
      const profit = computeUnitProfit(price, cost);

      assert.equal(profit, 12.0);
      assert.equal(formatPeso(profit), '₱12.00');
    });

    test('computes correct profit for all variants in baseline catalog', async () => {
      const service = new ProductService();
      const products = await service.getProducts();
      const toyo = products.find((p) => p.name === 'Toyo');

      assert.ok(toyo, 'Toyo must exist in baseline');
      const var1L = toyo.variants.find((v) => v.size === '1L');
      assert.ok(var1L);
      assert.equal(var1L.cost_price, 38.0);
      assert.equal(var1L.selling_price, 50.0);
      assert.equal(var1L.unit_profit, 12.0);
    });
  });

  describe('Scenario 3: Negative price rejection', () => {
    test('Zod validation halts submission for negative selling price (-10.00)', () => {
      const result = variantInputSchema.safeParse({
        size: '350',
        cost_price: 14.0,
        selling_price: -10.0,
        min_stock_level: 48,
      });

      assert.equal(result.success, false, 'Validation must fail for negative selling price');
      if (!result.success) {
        interface IssueLike {
          path?: (string | number)[];
          origin?: string;
          message: string;
        }
        const issues: IssueLike[] = (result.error.issues || []) as IssueLike[];
        const error = issues.find(
          (e) => (e.path && e.path.includes('selling_price')) || e.origin === 'number'
        );
        assert.ok(error, 'Must report error on selling_price');
        assert.match(error.message, /(greater than or equal to 0|>=0|too small)/i);
      }
    });

    test('Zod validation halts submission for negative cost price', () => {
      const result = variantInputSchema.safeParse({
        size: '1L',
        cost_price: -5.0,
        selling_price: 50.0,
        min_stock_level: 30,
      });

      assert.equal(result.success, false, 'Validation must fail for negative cost price');
    });

    test('productInputSchema rejects product with invalid variants', () => {
      const result = productInputSchema.safeParse({
        name: 'Invalid Product',
        category_id: null,
        variants: [
          { size: '350', cost_price: 10, selling_price: -10, min_stock_level: 5 },
          { size: '1L', cost_price: 20, selling_price: 30, min_stock_level: 5 },
          { size: 'gal', cost_price: 50, selling_price: 60, min_stock_level: 5 },
        ],
      });

      assert.equal(result.success, false, 'Product schema must reject invalid variant price');
    });

    test('productInputSchema requires non-empty trimmed product name', () => {
      const result = productInputSchema.safeParse({
        name: '   ',
        category_id: null,
        variants: [
          { size: '350', cost_price: 10, selling_price: 15, min_stock_level: 5 },
          { size: '1L', cost_price: 20, selling_price: 30, min_stock_level: 5 },
          { size: 'gal', cost_price: 50, selling_price: 60, min_stock_level: 5 },
        ],
      });

      assert.equal(result.success, false, 'Product schema must reject empty name');
    });
  });

  describe('Scenario 4: Product deletion safeguard', () => {
    test('generates confirmation prompt matching ARL-8 Scenario 4 wording', () => {
      const prompt = getDeleteProductPrompt('Patis');

      assert.equal(prompt.title, 'Delete Patis?');
      assert.equal(
        prompt.message,
        'This removes Patis and its three sizes from the product list. Past sales stay in the records.'
      );
      assert.equal(prompt.confirmLabel, 'Delete product');
      assert.equal(prompt.variant, 'danger');
    });

    test('deletes product and its variants from active catalog', async () => {
      const service = new ProductService();
      const initialProducts = await service.getProducts();
      assert.equal(initialProducts.length, 3);

      const patis = initialProducts.find((p) => p.name === 'Patis');
      assert.ok(patis);

      const deleteResult = await service.deleteProduct(patis.id);
      assert.equal(deleteResult.success, true);

      const remainingProducts = await service.getProducts();
      assert.equal(remainingProducts.length, 2, 'Only 2 products remain');
      assert.equal(remainingProducts.some((p) => p.name === 'Patis'), false);
    });
  });

  describe('Product Updates and Formatting', () => {
    test('updates existing product name, category, and variant prices', async () => {
      const service = new ProductService();
      const products = await service.getProducts();
      const suka = products.find((p) => p.name === 'Suka');
      assert.ok(suka);

      const updated = await service.updateProduct({
        id: suka.id,
        name: 'Suka Paombong',
        category_id: 'cat-2',
        variants: [
          { size: '350', cost_price: 12.0, selling_price: 18.0, min_stock_level: 50 },
          { size: '1L', cost_price: 32.0, selling_price: 45.0, min_stock_level: 25 },
          { size: 'gal', cost_price: 105.0, selling_price: 140.0, min_stock_level: 15 },
        ],
      });

      assert.equal(updated.name, 'Suka Paombong');
      const v350 = updated.variants.find((v) => v.size === '350');
      assert.ok(v350);
      assert.equal(v350.cost_price, 12.0);
      assert.equal(v350.selling_price, 18.0);
      assert.equal(v350.unit_profit, 6.0);
    });

    test('formats peso amounts consistently with 2 decimals and currency symbol', () => {
      assert.equal(formatPeso(12), '₱12.00');
      assert.equal(formatPeso(125.5), '₱125.50');
      assert.equal(formatPeso(1600), '₱1,600.00');
    });

    test('resolves standard size labels', () => {
      assert.equal(getSizeLabel('350'), '350 ml');
      assert.equal(getSizeLabel('1L'), '1 L');
      assert.equal(getSizeLabel('gal'), '1 gal');
    });
  });
});
