/**
/**
 * Component and API Contracts: Product Category Management with Cascade Validation
 * Feature: ARL-7 (005-product-category-management)
 */

export interface Category {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryWithProductCount extends Category {
  product_count: number;
}

export interface CreateCategoryInput {
  name: string;
}

export interface RenameCategoryInput {
  id: string;
  name: string;
}

export interface DeleteCategoryResult {
  success: boolean;
  deletedId: string;
  orphanedProductCount: number;
  error?: string;
}

export interface CategoryFormState {
  isOpen: boolean;
  mode: 'add' | 'rename';
  category?: CategoryWithProductCount | null;
}

/**
 * Generates the user-facing confirmation dialog options for deleting a category.
 * Conforms to ARL-7 acceptance criteria scenarios 3 & 4.
 */
export function getDeleteCategoryPrompt(name: string, productCount: number): {
  title: string;
  message: string;
  confirmLabel: string;
  variant: 'danger';
} {
  const title = `Delete ${name}?`;
  const message =
    productCount > 0
      ? `${productCount} product${productCount > 1 ? 's are' : ' is'} in this category. They will become uncategorized.`
      : 'This category is empty.';

  return {
    title,
    message,
    confirmLabel: 'Delete category',
    variant: 'danger',
  };
}

/**
 * Validates a category name input.
 * Rules:
 * - Must be non-empty after trim
 * - Minimum 1 character, maximum 60 characters
 */
export function validateCategoryName(rawName: string): { valid: boolean; error?: string; name: string } {
  const name = (rawName || '').trim();
  if (!name) {
    return { valid: false, error: 'Category name is required.', name };
  }
  if (name.length > 60) {
    return { valid: false, error: 'Category name must not exceed 60 characters.', name };
  }
  return { valid: true, name };
}
