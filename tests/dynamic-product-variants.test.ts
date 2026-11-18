import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getSizeLabel,
  variantInputSchema,
  productInputSchema,
} from '../specs/027-dynamic-product-variants-in-form-categories/contracts/product-contracts.ts';
import {
  ProductService,
  resetInMemoryProducts,
  type CreateProductInput,
} from '../lib/products/product-service.ts';
import { createCategory, resetCategoryStore } from '../lib/categories/category-service.ts';

describe('Feature ARL-38: In-Form Category Creation & Dynamic Product Variant Management', () => {
  beforeEach(() => {
    resetInMemoryProducts();
    resetCategoryStore();
  });

  describe('Contract & Validation (Zod Schemas)', () => {
    test('variantInputSchema accepts custom packaging sizes and non-negative pricing', () => {
      const validCustomVariant = {
        size: '500 ml',
        cost_price: 22.5,
        selling_price: 32.0,
        min_stock_level: 15,
        opening_stock: 40,
      };

      const result = variantInputSchema.safeParse(validCustomVariant);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.size, '500 ml');
        assert.equal(result.data.cost_price, 22.5);
      }
    });

    test('variantInputSchema rejects empty or whitespace-only size label', () => {
      const emptySizeVariant = {
        size: '   ',
        cost_price: 10,
        selling_price: 15,
        min_stock_level: 5,
      };

      const result = variantInputSchema.safeParse(emptySizeVariant);
      assert.equal(result.success, false);
      if (!result.success) {
        const issues = result.error.issues;
        assert.ok(issues.some((i) => i.message.includes('required') || i.message.includes('Variant size')));
      }
    });

    test('productInputSchema allows single-variant products (dynamic length >= 1)', () => {
      const singleVariantProduct = {
        name: 'Special Blend Oil',
        category_id: null,
        variants: [
          {
            size: '1 L',
            cost_price: 50,
            selling_price: 75,
            min_stock_level: 10,
            opening_stock: 25,
          },
        ],
      };

      const result = productInputSchema.safeParse(singleVariantProduct);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.variants.length, 1);
      }
    });

    test('productInputSchema allows 4+ packaging variants', () => {
      const multiVariantProduct = {
        name: 'Toyo Supreme',
        category_id: null,
        variants: [
          { size: '200 ml', cost_price: 8, selling_price: 12, min_stock_level: 20 },
          { size: '350 ml', cost_price: 14, selling_price: 20, min_stock_level: 48 },
          { size: '1 L', cost_price: 38, selling_price: 50, min_stock_level: 30 },
          { size: '1 gal', cost_price: 125, selling_price: 160, min_stock_level: 12 },
          { size: '20 L Drum', cost_price: 600, selling_price: 800, min_stock_level: 5 },
        ],
      };

      const result = productInputSchema.safeParse(multiVariantProduct);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.variants.length, 5);
      }
    });

    test('productInputSchema rejects duplicate variant sizes for the same product', () => {
      const duplicateSizesProduct = {
        name: 'Patis Duplicate',
        category_id: null,
        variants: [
          { size: '1 L', cost_price: 30, selling_price: 45, min_stock_level: 10 },
          { size: ' 1 l ', cost_price: 32, selling_price: 48, min_stock_level: 10 },
        ],
      };

      const result = productInputSchema.safeParse(duplicateSizesProduct);
      assert.equal(result.success, false);
      if (!result.success) {
        const issues = result.error.issues;
        assert.ok(issues.some((i) => i.message.includes('unique')));
      }
    });

    test('productInputSchema rejects products with 0 variants', () => {
      const noVariantsProduct = {
        name: 'Empty Product',
        category_id: null,
        variants: [],
      };

      const result = productInputSchema.safeParse(noVariantsProduct);
      assert.equal(result.success, false);
    });
  });

  describe('Size Label Helper (getSizeLabel)', () => {
    test('returns standard labels for known keys and returns custom strings unchanged', () => {
      assert.equal(getSizeLabel('350'), '350 ml');
      assert.equal(getSizeLabel('1L'), '1 L');
      assert.equal(getSizeLabel('gal'), '1 gal');
      assert.equal(getSizeLabel('500 ml'), '500 ml');
      assert.equal(getSizeLabel('20 L Drum'), '20 L Drum');
      assert.equal(getSizeLabel('Sachet 100ml'), 'Sachet 100ml');
    });
  });

  describe('ProductService Dynamic Variants Execution', () => {
    test('creates product with custom sizes and variable variant count', async () => {
      const service = new ProductService();
      const input: CreateProductInput = {
        name: 'Golden Cooking Oil',
        category_id: null,
        variants: [
          { size: '500 ml', cost_price: 45, selling_price: 60, min_stock_level: 20, opening_stock: 50 },
          { size: '20 L Drum', cost_price: 1500, selling_price: 1950, min_stock_level: 4, opening_stock: 10 },
        ],
      };

      const created = await service.createProduct(input);
      assert.equal(created.name, 'Golden Cooking Oil');
      assert.equal(created.variants.length, 2);

      const v500 = created.variants.find((v) => v.size === '500 ml');
      assert.ok(v500);
      assert.equal(v500.selling_price, 60);
      assert.equal(v500.stock_quantity, 50);
      assert.equal(v500.unit_profit, 15);

      const vDrum = created.variants.find((v) => v.size === '20 L Drum');
      assert.ok(vDrum);
      assert.equal(vDrum.selling_price, 1950);
      assert.equal(vDrum.stock_quantity, 10);
      assert.equal(vDrum.unit_profit, 450);
    });

    test('adds a new packaging variant to an existing product on update', async () => {
      const service = new ProductService();
      const products = await service.getProducts();
      const toyo = products.find((p) => p.name.toLowerCase() === 'toyo');
      assert.ok(toyo, 'Toyo baseline product must exist');
      assert.equal(toyo.variants.length, 3, 'Toyo initially has 3 variants');

      // Add a 4th variant: "500 ml"
      const updated = await service.updateProduct({
        id: toyo.id,
        name: toyo.name,
        category_id: toyo.category_id,
        variants: [
          ...toyo.variants.map((v) => ({
            size: v.size,
            cost_price: v.cost_price,
            selling_price: v.selling_price,
            min_stock_level: v.min_stock_level,
          })),
          {
            size: '500 ml',
            cost_price: 22.0,
            selling_price: 30.0,
            min_stock_level: 20,
            opening_stock: 35,
          },
        ],
      });

      assert.equal(updated.variants.length, 4, 'Toyo now has 4 variants');
      const v500 = updated.variants.find((v) => v.size === '500 ml');
      assert.ok(v500, '500 ml variant was appended');
      assert.equal(v500.cost_price, 22.0);
      assert.equal(v500.selling_price, 30.0);
      assert.equal(v500.stock_quantity, 35);
      assert.equal(v500.unit_profit, 8.0);

      // Verify existing variants retain their original inventory
      const v350 = updated.variants.find((v) => v.size === '350');
      assert.ok(v350);
      assert.equal(v350.stock_quantity, 96, '350ml stock quantity remained preserved');
    });
  });

  describe('Inline Category Creation Integration', () => {
    test('creates new category and attaches immediately to product', async () => {
      const newCategory = await createCategory({ name: 'Cooking Oil' });
      assert.ok(newCategory.id);
      assert.equal(newCategory.name, 'Cooking Oil');

      const service = new ProductService();
      const product = await service.createProduct({
        name: 'Pure Palm Oil',
        category_id: newCategory.id,
        variants: [
          { size: '1 L', cost_price: 70, selling_price: 95, min_stock_level: 15, opening_stock: 30 },
        ],
      });

      assert.equal(product.category_id, newCategory.id);
      assert.equal(product.variants.length, 1);
    });
  });
});
