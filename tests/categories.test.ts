import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCategoryName,
  getDeleteCategoryPrompt,
  getCategories,
  createCategory,
  renameCategory,
  deleteCategory,
  resetCategoryStore,
  getStoredProducts,
} from '../lib/categories/category-service.ts';

describe('Product Category Management & Cascade Validation (ARL-7)', () => {
  beforeEach(() => {
    resetCategoryStore();
  });

  describe('Category Name Validation', () => {
    test('rejects empty string or null/undefined', () => {
      const res1 = validateCategoryName('');
      assert.strictEqual(res1.valid, false);
      assert.ok(res1.error?.includes('required'));

      const res2 = validateCategoryName('   ');
      assert.strictEqual(res2.valid, false);
      assert.ok(res2.error?.includes('required'));
    });

    test('rejects category names exceeding 60 characters', () => {
      const longName = 'A'.repeat(61);
      const res = validateCategoryName(longName);
      assert.strictEqual(res.valid, false);
      assert.ok(res.error?.includes('must not exceed 60 characters'));
    });

    test('trims surrounding whitespace from valid names', () => {
      const res = validateCategoryName('   Specialty Blends   ');
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.name, 'Specialty Blends');
    });
  });

  describe('Delete Category Prompt Phrasing (Acceptance Criteria Scenarios 3 & 4)', () => {
    test('formats prompt for empty category with 0 linked products', () => {
      const prompt = getDeleteCategoryPrompt('Specialty Blends', 0);
      assert.strictEqual(prompt.title, 'Delete Specialty Blends?');
      assert.strictEqual(prompt.message, 'This category is empty.');
      assert.strictEqual(prompt.confirmLabel, 'Delete category');
      assert.strictEqual(prompt.variant, 'danger');
    });

    test('formats orphan warning prompt for category with 1 linked product', () => {
      const prompt = getDeleteCategoryPrompt('Single Blend', 1);
      assert.strictEqual(prompt.title, 'Delete Single Blend?');
      assert.strictEqual(
        prompt.message,
        '1 product is in this category. They will become uncategorized.'
      );
      assert.strictEqual(prompt.confirmLabel, 'Delete category');
      assert.strictEqual(prompt.variant, 'danger');
    });

    test('formats orphan warning prompt for category with 3 linked products (Scenario 3)', () => {
      const prompt = getDeleteCategoryPrompt('Soy Sauce', 3);
      assert.strictEqual(prompt.title, 'Delete Soy Sauce?');
      assert.strictEqual(
        prompt.message,
        '3 products are in this category. They will become uncategorized.'
      );
      assert.strictEqual(prompt.confirmLabel, 'Delete category');
      assert.strictEqual(prompt.variant, 'danger');
    });
  });

  describe('Category CRUD & Orphan Cascade Handling', () => {
    test('Scenario 1: creates new condiment category with product count 0', async () => {
      const initialList = await getCategories();
      assert.strictEqual(initialList.length, 3);

      const created = await createCategory({ name: 'Specialty Blends' });
      assert.ok(created.id);
      assert.strictEqual(created.name, 'Specialty Blends');
      assert.strictEqual(created.product_count, 0);

      const updatedList = await getCategories();
      assert.strictEqual(updatedList.length, 4);
      const found = updatedList.find((c) => c.name === 'Specialty Blends');
      assert.ok(found);
      assert.strictEqual(found!.product_count, 0);
    });

    test('Scenario 1 Edge Case: prevents creating duplicate category (case-insensitive)', async () => {
      await assert.rejects(
        async () => {
          await createCategory({ name: 'soy sauce' }); // Already exists as "Soy Sauce"
        },
        /already exists/i
      );
    });

    test('Scenario 2: renames existing category and updates table state', async () => {
      const initialList = await getCategories();
      const soySauce = initialList.find((c) => c.name === 'Soy Sauce');
      assert.ok(soySauce);

      const renamed = await renameCategory({
        id: soySauce!.id,
        name: 'Premium Soy Sauce',
      });
      assert.strictEqual(renamed.name, 'Premium Soy Sauce');
      assert.strictEqual(renamed.product_count, 3);

      const updatedList = await getCategories();
      assert.strictEqual(
        updatedList.some((c) => c.name === 'Soy Sauce'),
        false
      );
      const found = updatedList.find((c) => c.name === 'Premium Soy Sauce');
      assert.ok(found);
      assert.strictEqual(found!.product_count, 3);
    });

    test('Scenario 2 Edge Case: prevents renaming to an already taken name', async () => {
      const initialList = await getCategories();
      const vinegar = initialList.find((c) => c.name === 'Vinegar');
      assert.ok(vinegar);

      await assert.rejects(
        async () => {
          await renameCategory({ id: vinegar!.id, name: 'Soy Sauce' });
        },
        /already exists/i
      );
    });

    test('Scenario 3: deletes category with 3 linked products and sets product.category_id to NULL', async () => {
      const initialList = await getCategories();
      const soySauce = initialList.find((c) => c.name === 'Soy Sauce');
      assert.ok(soySauce);
      assert.strictEqual(soySauce!.product_count, 3);

      // Verify products are currently linked to this category
      const preProducts = getStoredProducts().filter((p) => p.category_id === soySauce!.id);
      assert.strictEqual(preProducts.length, 3);

      // Perform deletion
      const deleteResult = await deleteCategory(soySauce!.id);
      assert.strictEqual(deleteResult.success, true);
      assert.strictEqual(deleteResult.orphanedProductCount, 3);

      // Verify category is removed from category list
      const postCategories = await getCategories();
      assert.strictEqual(
        postCategories.some((c) => c.id === soySauce!.id),
        false
      );

      // Verify products are NOT deleted, but have category_id set to NULL
      const allProducts = getStoredProducts();
      assert.strictEqual(allProducts.length, 9); // Total products unchanged
      const orphanedProducts = allProducts.filter((p) =>
        preProducts.some((pre) => pre.id === p.id)
      );
      assert.strictEqual(orphanedProducts.length, 3);
      for (const product of orphanedProducts) {
        assert.strictEqual(product.category_id, null);
      }
    });

    test('Scenario 4: deletes empty category without error', async () => {
      // Create empty category
      const emptyCat = await createCategory({ name: 'Empty Test Category' });
      assert.strictEqual(emptyCat.product_count, 0);

      // Delete empty category
      const deleteResult = await deleteCategory(emptyCat.id);
      assert.strictEqual(deleteResult.success, true);
      assert.strictEqual(deleteResult.orphanedProductCount, 0);

      // Verify category removed
      const postCategories = await getCategories();
      assert.strictEqual(
        postCategories.some((c) => c.id === emptyCat.id),
        false
      );
    });
  });
});
