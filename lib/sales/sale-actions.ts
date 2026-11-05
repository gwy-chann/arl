'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '../supabase/server.ts';
import { SaleService } from './sale-service.ts';
import type { CreateSaleInput } from './sale-contracts.ts';

export async function submitNewSale(input: CreateSaleInput) {
  try {
    const supabase = await createClient();
    const service = new SaleService(supabase);
    const result = await service.createSaleTransaction(input);

    if (result.success) {
      revalidatePath('/sales');
      revalidatePath('/sales/new');
      revalidatePath('/inventory');
      revalidatePath('/customers');
      revalidatePath('/dashboard');
    }

    return result;
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred while saving sale.',
    };
  }
}
