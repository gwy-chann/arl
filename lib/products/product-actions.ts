'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  ProductService,
  type CreateProductInput,
  type UpdateProductInput,
} from './product-service';
import type { ProductWithVariants } from '@/specs/006-multi-variant-product-catalog/contracts/product-contracts';

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

async function getSafeSupabaseClient() {
  try {
    return await createClient();
  } catch {
    return null;
  }
}

/**
 * Server action to fetch all products with variants.
 */
export async function getProductsAction(): Promise<ProductWithVariants[]> {
  const supabase = await getSafeSupabaseClient();
  const service = new ProductService(supabase);
  return await service.getProducts();
}

/**
 * Server action to fetch a product by ID.
 */
export async function getProductByIdAction(
  id: string
): Promise<ProductWithVariants | null> {
  const supabase = await getSafeSupabaseClient();
  const service = new ProductService(supabase);
  return await service.getProductById(id);
}

/**
 * Server action to atomically create a new product and variants.
 */
export async function createProductAction(input: CreateProductInput): Promise<{
  success: boolean;
  product?: ProductWithVariants;
  error?: string;
}> {
  try {
    const supabase = await getSafeSupabaseClient();
    const service = new ProductService(supabase);
    const product = await service.createProduct(input);
    revalidatePath('/products');
    revalidatePath('/products/categories');
    return { success: true, product };
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err) || 'Failed to create product',
    };
  }
}

/**
 * Server action to atomically update an existing product and variants.
 */
export async function updateProductAction(input: UpdateProductInput): Promise<{
  success: boolean;
  product?: ProductWithVariants;
  error?: string;
}> {
  try {
    const supabase = await getSafeSupabaseClient();
    const service = new ProductService(supabase);
    const product = await service.updateProduct(input);
    revalidatePath('/products');
    revalidatePath(`/products/${input.id}/edit`);
    revalidatePath('/products/categories');
    return { success: true, product };
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err) || 'Failed to update product',
    };
  }
}

/**
 * Server action to delete a product.
 */
export async function deleteProductAction(id: string): Promise<{
  success: boolean;
  deletedId?: string;
  error?: string;
}> {
  try {
    const supabase = await getSafeSupabaseClient();
    const service = new ProductService(supabase);
    const result = await service.deleteProduct(id);
    revalidatePath('/products');
    revalidatePath('/products/categories');
    return { success: true, deletedId: result.deletedId };
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err) || 'Failed to delete product',
    };
  }
}
