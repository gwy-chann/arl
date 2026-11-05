'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '../supabase/server.ts';
import { SaleService } from './sale-service.ts';
import type {
  CreateSaleInput,
  UpdateSalePaymentInput,
  UpdateSaleOrderStatusInput,
} from './sale-contracts.ts';

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

export async function updateSalePaymentAction(input: UpdateSalePaymentInput) {
  try {
    const supabase = await createClient();
    const service = new SaleService(supabase);
    const result = await service.updateSalePayment(
      input.saleId,
      input.paymentStatus,
      input.amountPaid
    );

    if (result.success) {
      revalidatePath('/sales');
      revalidatePath(`/sales/${input.saleId}`);
      revalidatePath('/customers');
      revalidatePath('/dashboard');
    }

    return result;
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update payment status.',
    };
  }
}

export async function updateSaleOrderStatusAction(input: UpdateSaleOrderStatusInput) {
  try {
    const supabase = await createClient();
    const service = new SaleService(supabase);
    const result = await service.updateSaleOrderStatus(
      input.saleId,
      input.orderStatus
    );

    if (result.success) {
      revalidatePath('/sales');
      revalidatePath(`/sales/${input.saleId}`);
      revalidatePath('/customers');
      revalidatePath('/dashboard');
    }

    return result;
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update order status.',
    };
  }
}
