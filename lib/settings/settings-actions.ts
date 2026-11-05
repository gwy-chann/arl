'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  reminderSettingsSchema,
  batchStockMinimumsSchema,
  changePasswordSchema,
  type ReminderSettingsInput,
  type BatchStockMinimumsInput,
  type ChangePasswordInput,
  type SettingsActionResult,
  type SystemSettingsDTO,
} from './settings-contracts.ts';
import {
  getSystemSettings,
  updateReminderSettings,
  getStockMinimumsMatrix,
  updateBatchStockMinimums,
} from './settings-service.ts';

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
 * Server action to fetch current system settings.
 */
export async function getSettingsAction(): Promise<SystemSettingsDTO> {
  const supabase = await getSafeSupabaseClient();
  return await getSystemSettings(supabase ?? undefined);
}

/**
 * Server action to update payment reminder settings.
 */
export async function saveReminderSettingsAction(
  input: ReminderSettingsInput
): Promise<SettingsActionResult<SystemSettingsDTO>> {
  try {
    const parsed = reminderSettingsSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0]?.toString() || 'general';
        fieldErrors[field] = [...(fieldErrors[field] || []), issue.message];
      });
      return {
        success: false,
        error: 'Please fix validation errors',
        fieldErrors,
      };
    }

    const supabase = await getSafeSupabaseClient();
    const updated = await updateReminderSettings(parsed.data, supabase ?? undefined);

    revalidatePath('/settings/reminders');
    revalidatePath('/dashboard');
    revalidatePath('/customers/balances');

    return {
      success: true,
      data: updated,
    };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Server action to fetch the 3x3 minimum stock matrix.
 */
export async function getStockMatrixAction() {
  const supabase = await getSafeSupabaseClient();
  return await getStockMinimumsMatrix(supabase ?? undefined);
}

/**
 * Server action to batch update variant minimum stock thresholds.
 */
export async function saveStockMinimumsAction(
  input: BatchStockMinimumsInput
): Promise<SettingsActionResult> {
  try {
    const parsed = batchStockMinimumsSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: 'Invalid minimum stock values',
      };
    }

    const supabase = await getSafeSupabaseClient();
    await updateBatchStockMinimums(parsed.data.items, supabase ?? undefined);

    revalidatePath('/settings/stock');
    revalidatePath('/inventory');
    revalidatePath('/inventory/low');
    revalidatePath('/dashboard');

    return {
      success: true,
    };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err),
    };
  }
}

/**
 * Server action to validate and update administrator password via Supabase Auth.
 */
export async function updatePasswordAction(
  input: ChangePasswordInput
): Promise<SettingsActionResult> {
  try {
    const parsed = changePasswordSchema.safeParse(input);
    if (!parsed.success) {
      const confirmError = parsed.error.issues.find((i) => i.path.includes('confirm_password'));
      return {
        success: false,
        error: confirmError?.message || 'New passwords do not match',
      };
    }

    const supabase = await getSafeSupabaseClient();
    if (supabase) {
      const { error } = await supabase.auth.updateUser({
        password: parsed.data.new_password,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    }

    return {
      success: true,
    };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err),
    };
  }
}
