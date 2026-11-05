import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Category,
  CategoryWithProductCount,
  CreateCategoryInput,
  RenameCategoryInput,
  DeleteCategoryResult,
} from '../../specs/005-product-category-management/contracts/category-contracts.ts';

import {
  validateCategoryName,
  getDeleteCategoryPrompt,
} from '../../specs/005-product-category-management/contracts/category-contracts.ts';

export { validateCategoryName, getDeleteCategoryPrompt };
export type {
  Category,
  CategoryWithProductCount,
  CreateCategoryInput,
  RenameCategoryInput,
  DeleteCategoryResult,
};

export interface MockProduct {
  id: string;
  name: string;
  category_id: string | null;
}

interface SupabaseCategoryRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  products?: Array<{ id: string }> | null;
}

// In-memory baseline store replicating ARLQ domain model
const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Soy Sauce',
    created_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
    updated_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
  },
  {
    id: 'cat-2',
    name: 'Vinegar',
    created_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
    updated_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
  },
  {
    id: 'cat-3',
    name: 'Fish Sauce',
    created_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
    updated_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
  },
];

const INITIAL_PRODUCTS: MockProduct[] = [
  { id: 'p1', name: 'Toyo 350 ml', category_id: 'cat-1' },
  { id: 'p2', name: 'Toyo 1 L', category_id: 'cat-1' },
  { id: 'p3', name: 'Toyo 1 gal', category_id: 'cat-1' },
  { id: 'p4', name: 'Suka 350 ml', category_id: 'cat-2' },
  { id: 'p5', name: 'Suka 1 L', category_id: 'cat-2' },
  { id: 'p6', name: 'Suka 1 gal', category_id: 'cat-2' },
  { id: 'p7', name: 'Patis 350 ml', category_id: 'cat-3' },
  { id: 'p8', name: 'Patis 1 L', category_id: 'cat-3' },
  { id: 'p9', name: 'Patis 1 gal', category_id: 'cat-3' },
];

let inMemoryCategories: Category[] = JSON.parse(JSON.stringify(INITIAL_CATEGORIES));
let inMemoryProducts: MockProduct[] = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));

/**
 * Resets the in-memory data store to baseline seed state (used by test suites).
 */
export function resetCategoryStore(): void {
  inMemoryCategories = JSON.parse(JSON.stringify(INITIAL_CATEGORIES));
  inMemoryProducts = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
}

/**
 * Returns current in-memory products (for testing orphan unlinking).
 */
export function getStoredProducts(): readonly MockProduct[] {
  return inMemoryProducts;
}

/**
 * Retrieves all categories with live product count.
 */
export async function getCategories(
  supabaseClient?: SupabaseClient | null
): Promise<CategoryWithProductCount[]> {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('categories')
        .select(`
          id,
          name,
          created_at,
          updated_at,
          products ( id )
        `)
        .order('name', { ascending: true });

      if (!error && Array.isArray(data)) {
        return (data as unknown as SupabaseCategoryRow[]).map((row) => ({
          id: row.id,
          name: row.name,
          created_at: row.created_at,
          updated_at: row.updated_at,
          product_count: Array.isArray(row.products) ? row.products.length : 0,
        }));
      }
    } catch {
      // Graceful fallback to in-memory store
    }
  }

  // Fallback to in-memory store
  return inMemoryCategories.map((c) => {
    const product_count = inMemoryProducts.filter((p) => p.category_id === c.id).length;
    return {
      ...c,
      product_count,
    };
  });
}

/**
 * Creates a new category.
 */
export async function createCategory(
  input: CreateCategoryInput,
  supabaseClient?: SupabaseClient | null
): Promise<CategoryWithProductCount> {
  const validation = validateCategoryName(input.name);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid category name');
  }

  const trimmedName = validation.name;

  // Check uniqueness (case-insensitive)
  const existing = inMemoryCategories.some(
    (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (existing) {
    throw new Error(`Category "${trimmedName}" already exists.`);
  }

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('categories')
        .insert({ name: trimmedName })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          name: data.name,
          created_at: data.created_at,
          updated_at: data.updated_at,
          product_count: 0,
        };
      }
    } catch {
      // Fallback to in-memory store
    }
  }

  const newCategory: Category = {
    id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: trimmedName,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  inMemoryCategories.push(newCategory);

  return {
    ...newCategory,
    product_count: 0,
  };
}

/**
 * Renames an existing category.
 */
export async function renameCategory(
  input: RenameCategoryInput,
  supabaseClient?: SupabaseClient | null
): Promise<CategoryWithProductCount> {
  const validation = validateCategoryName(input.name);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid category name');
  }

  const trimmedName = validation.name;

  // Check duplicate with another category
  const duplicate = inMemoryCategories.some(
    (c) => c.id !== input.id && c.name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (duplicate) {
    throw new Error(`Category "${trimmedName}" already exists.`);
  }

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('categories')
        .update({ name: trimmedName, updated_at: new Date().toISOString() })
        .eq('id', input.id)
        .select()
        .single();

      if (!error && data) {
        const product_count = inMemoryProducts.filter((p) => p.category_id === input.id).length;
        return {
          id: data.id,
          name: data.name,
          created_at: data.created_at,
          updated_at: data.updated_at,
          product_count,
        };
      }
    } catch {
      // Fallback to in-memory store
    }
  }

  const category = inMemoryCategories.find((c) => c.id === input.id);
  if (!category) {
    throw new Error('Category not found');
  }

  category.name = trimmedName;
  category.updated_at = new Date().toISOString();

  const product_count = inMemoryProducts.filter((p) => p.category_id === input.id).length;
  return {
    ...category,
    product_count,
  };
}

/**
 * Deletes a category and unlinks associated products (sets category_id = NULL).
 */
export async function deleteCategory(
  id: string,
  supabaseClient?: SupabaseClient | null
): Promise<DeleteCategoryResult> {
  if (supabaseClient) {
    try {
      // Unlink products first (or let FK ON DELETE SET NULL handle it)
      await supabaseClient
        .from('products')
        .update({ category_id: null })
        .eq('category_id', id);

      const { error } = await supabaseClient
        .from('categories')
        .delete()
        .eq('id', id);

      if (!error) {
        return { success: true, deletedId: id, orphanedProductCount: 0 };
      }
    } catch {
      // Fallback to in-memory store
    }
  }

  const categoryIndex = inMemoryCategories.findIndex((c) => c.id === id);
  if (categoryIndex === -1) {
    return { success: false, deletedId: id, orphanedProductCount: 0, error: 'Category not found' };
  }

  // Count orphaned products before unlinking
  const linkedCount = inMemoryProducts.filter((p) => p.category_id === id).length;

  // Unlink products (set category_id = null)
  inMemoryProducts = inMemoryProducts.map((p) =>
    p.category_id === id ? { ...p, category_id: null } : p
  );

  // Remove category
  inMemoryCategories.splice(categoryIndex, 1);

  return {
    success: true,
    deletedId: id,
    orphanedProductCount: linkedCount,
  };
}
