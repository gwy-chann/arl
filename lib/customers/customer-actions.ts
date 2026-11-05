'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  type CustomerInput,
  type CustomerWithRollup,
  type CustomerProfileData,
  type CustomerActionResult,
} from './customer-contracts.ts';
import {
  createCustomer,
  updateCustomer,
  getCustomerDirectory,
  getCustomerById,
  validateCustomerInput,
} from './customer-service.ts';

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

export async function getCustomersAction(): Promise<CustomerWithRollup[]> {
  const supabase = await getSafeSupabaseClient();
  return await getCustomerDirectory(supabase);
}

export async function getCustomerByIdAction(
  id: string
): Promise<CustomerProfileData | null> {
  const supabase = await getSafeSupabaseClient();
  return await getCustomerById(id, supabase);
}

export async function createCustomerAction(
  input: CustomerInput
): Promise<CustomerActionResult> {
  try {
    const validation = validateCustomerInput(input);
    if (!validation.success || !validation.data) {
      return {
        success: false,
        error: 'Please fix validation errors',
        fieldErrors: validation.errors,
      };
    }

    const supabase = await getSafeSupabaseClient();
    const customer = await createCustomer(validation.data, supabase);

    revalidatePath('/customers');
    revalidatePath(`/customers/${customer.id}`);

    return {
      success: true,
      customerId: customer.id,
      customer,
    };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err),
    };
  }
}

export async function updateCustomerAction(
  id: string,
  input: CustomerInput
): Promise<CustomerActionResult> {
  try {
    const validation = validateCustomerInput(input);
    if (!validation.success || !validation.data) {
      return {
        success: false,
        error: 'Please fix validation errors',
        fieldErrors: validation.errors,
      };
    }

    const supabase = await getSafeSupabaseClient();
    const customer = await updateCustomer(id, validation.data, supabase);

    revalidatePath('/customers');
    revalidatePath(`/customers/${customer.id}`);

    return {
      success: true,
      customerId: customer.id,
      customer,
    };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err),
    };
  }
}
