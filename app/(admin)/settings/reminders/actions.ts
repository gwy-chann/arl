'use server';

import { revalidatePath } from 'next/cache';
import { getPhilSmsBalance } from '@/lib/services/philsms-balance-service';
import type { PhilSmsAccountStatus } from '@/lib/services/philsms-contracts';

export interface PhilSmsAccountStatusActionResult {
  success: boolean;
  data?: PhilSmsAccountStatus;
  error?: string;
}

/**
 * Server action to fetch the current PhilSMS account and credit balance status.
 */
export async function getPhilSmsAccountStatusAction(): Promise<PhilSmsAccountStatusActionResult> {
  try {
    const status = await getPhilSmsBalance();
    return {
      success: status.success,
      data: status,
      error: status.errorMessage,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve PhilSMS balance';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server action to force-refresh PhilSMS credit balance from live gateway, bypassing the cache.
 */
export async function refreshPhilSmsBalanceAction(options?: {
  forceRefresh?: boolean;
}): Promise<PhilSmsAccountStatusActionResult> {
  try {
    const status = await getPhilSmsBalance({ forceRefresh: options?.forceRefresh ?? true });
    revalidatePath('/settings/reminders');
    return {
      success: status.success,
      data: status,
      error: status.errorMessage,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to refresh PhilSMS balance';
    return {
      success: false,
      error: message,
    };
  }
}
