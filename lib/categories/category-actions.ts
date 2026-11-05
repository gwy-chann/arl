'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  getCategories,
  createCategory,
  renameCategory,
  deleteCategory,
} from './category-service';
import type {
  CategoryWithProductCount,
  DeleteCategoryResult,
} from '@/specs/005-product-category-management/contracts/category-contracts';

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

/**
 * Server action to fetch all categories with live product count.
 */
export async function getCategoriesAction(): Promise<CategoryWithProductCount[]> {
  try {
    const supabase = await createClient();
    return await getCategories(supabase);
  } catch {
    return await getCategories();
  }
}

/**
 * Server action to create a new category.
 */
export async function createCategoryAction(name: string): Promise<{
  success: boolean;
  category?: CategoryWithProductCount;
  error?: string;
}> {
  try {
    let supabase = null;
    try {
      supabase = await createClient();
    } catch {
      // Offline fallback
    }

    const category = await createCategory({ name }, supabase);
    revalidatePath('/products/categories');
    return { success: true, category };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) || 'Failed to create category' };
  }
}

/**
 * Server action to rename an existing category.
 */
export async function renameCategoryAction(
  id: string,
  name: string
): Promise<{
  success: boolean;
  category?: CategoryWithProductCount;
  error?: string;
}> {
  try {
    let supabase = null;
    try {
      supabase = await createClient();
    } catch {
      // Offline fallback
    }

    const category = await renameCategory({ id, name }, supabase);
    revalidatePath('/products/categories');
    return { success: true, category };
  } catch (err: unknown) {
    return { success: false, error: getErrorMessage(err) || 'Failed to rename category' };
  }
}

/**
 * Server action to delete a category with cascade orphan unlinking.
 */
export async function deleteCategoryAction(
  id: string
): Promise<DeleteCategoryResult> {
  try {
    let supabase = null;
    try {
      supabase = await createClient();
    } catch {
      // Offline fallback
    }

    const result = await deleteCategory(id, supabase);
    revalidatePath('/products/categories');
    return result;
  } catch (err: unknown) {
    return {
      success: false,
      deletedId: id,
      orphanedProductCount: 0,
      error: getErrorMessage(err) || 'Failed to delete category',
    };
  }
}
