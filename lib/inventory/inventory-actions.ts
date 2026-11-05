'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { InventoryService } from '@/lib/services/inventory-service';
import type { InventoryVariant } from './types';

async function getSafeSupabaseClient() {
  try {
    return await createClient();
  } catch {
    return null;
  }
}

/**
 * Server action to fetch all inventory variants across all products.
 */
export async function getInventoryVariantsAction(): Promise<InventoryVariant[]> {
  const supabase = await getSafeSupabaseClient();
  const service = new InventoryService(supabase);
  return await service.getInventoryVariants();
}

/**
 * Server action to fetch only low stock variants.
 */
export async function getLowStockVariantsAction(): Promise<InventoryVariant[]> {
  const supabase = await getSafeSupabaseClient();
  const service = new InventoryService(supabase);
  return await service.getLowStockVariants();
}

/**
 * Server action to update stock quantity for a variant.
 */
export async function updateVariantStockAction(
  variantId: string,
  newStock: number
): Promise<{ success: boolean; data?: InventoryVariant; error?: string }> {
  try {
    const supabase = await getSafeSupabaseClient();
    const service = new InventoryService(supabase);
    const updated = await service.updateVariantStock(variantId, newStock);
    revalidatePath('/inventory');
    revalidatePath('/inventory/low');
    return { success: true, data: updated };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
