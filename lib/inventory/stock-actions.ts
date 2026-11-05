'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { StockService } from './stock-service.ts';
import type {
  StockMovementInput,
  MovementActionResult,
  StockMovementDisplayItem,
} from './stock-contracts.ts';

async function getSafeSupabaseClient() {
  try {
    return await createClient();
  } catch {
    return null;
  }
}

export async function recordStockMovementAction(
  input: StockMovementInput
): Promise<MovementActionResult> {
  const supabase = await getSafeSupabaseClient();
  const service = new StockService(supabase);
  const result = await service.recordMovement(input);

  if (result.success) {
    revalidatePath('/inventory');
    revalidatePath('/inventory/in');
    revalidatePath('/inventory/out');
    revalidatePath('/inventory/history');
    revalidatePath('/inventory/low');
  }

  return result;
}

export async function getMovementsAction(options?: {
  type?: string;
  search?: string;
}): Promise<StockMovementDisplayItem[]> {
  const supabase = await getSafeSupabaseClient();
  const service = new StockService(supabase);
  return await service.listMovements(options);
}
