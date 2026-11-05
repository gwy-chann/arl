import type { SupabaseClient } from '@supabase/supabase-js';
import {
  reminderSettingsSchema,
  batchStockMinimumsSchema,
  type ReminderSettingsInput,
  type SystemSettingsDTO,
  type StockMatrixProductDTO,
  type StockMatrixVariantDTO,
} from './settings-contracts.ts';

// In-memory fallback for system settings matching ARLQ domain defaults
const DEFAULT_SETTINGS: SystemSettingsDTO = {
  id: 'singleton_store_settings',
  reminder_days: 7,
  admin_mobile: '0917 555 0142',
  notification_channel: 'SMS',
  updated_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
};

let memorySettings: SystemSettingsDTO = { ...DEFAULT_SETTINGS };

// In-memory variant minimum stock levels baseline
const INITIAL_VARIANT_MINIMUMS: Record<string, { product_id: string; product_name: string; size: '350' | '1L' | 'gal'; stock_quantity: number; min_stock_level: number }> = {
  'toyo-350': { product_id: 'prod-toyo', product_name: 'Toyo', size: '350', stock_quantity: 96, min_stock_level: 48 },
  'toyo-1L': { product_id: 'prod-toyo', product_name: 'Toyo', size: '1L', stock_quantity: 58, min_stock_level: 30 },
  'toyo-gal': { product_id: 'prod-toyo', product_name: 'Toyo', size: 'gal', stock_quantity: 17, min_stock_level: 12 },
  'suka-350': { product_id: 'prod-suka', product_name: 'Suka', size: '350', stock_quantity: 72, min_stock_level: 48 },
  'suka-1L': { product_id: 'prod-suka', product_name: 'Suka', size: '1L', stock_quantity: 34, min_stock_level: 24 },
  'suka-gal': { product_id: 'prod-suka', product_name: 'Suka', size: 'gal', stock_quantity: 6, min_stock_level: 12 },
  'patis-350': { product_id: 'prod-patis', product_name: 'Patis', size: '350', stock_quantity: 21, min_stock_level: 36 },
  'patis-1L': { product_id: 'prod-patis', product_name: 'Patis', size: '1L', stock_quantity: 40, min_stock_level: 24 },
  'patis-gal': { product_id: 'prod-patis', product_name: 'Patis', size: 'gal', stock_quantity: 14, min_stock_level: 12 },
};

let memoryVariantMinimums = { ...INITIAL_VARIANT_MINIMUMS };

/**
 * Resets the in-memory state to baseline (used in testing).
 */
export function _resetSettingsStore() {
  memorySettings = { ...DEFAULT_SETTINGS };
  memoryVariantMinimums = JSON.parse(JSON.stringify(INITIAL_VARIANT_MINIMUMS));
}

/**
 * Retrieves the store system settings.
 */
export async function getSystemSettings(supabaseClient?: SupabaseClient | null): Promise<SystemSettingsDTO> {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('system_settings')
        .select('*')
        .eq('id', 'singleton_store_settings')
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          reminder_days: Number(data.reminder_days),
          admin_mobile: data.admin_mobile,
          notification_channel: data.notification_channel || 'SMS',
          updated_at: data.updated_at,
        };
      }
    } catch {
      // Graceful fallback to memory store
    }
  }

  return { ...memorySettings };
}

/**
 * Updates the payment reminder thresholds and admin mobile number.
 */
export async function updateReminderSettings(
  input: ReminderSettingsInput,
  supabaseClient?: SupabaseClient
): Promise<SystemSettingsDTO> {
  const validated = reminderSettingsSchema.parse(input);

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('system_settings')
        .upsert({
          id: 'singleton_store_settings',
          reminder_days: validated.reminder_days,
          admin_mobile: validated.admin_mobile,
          notification_channel: validated.notification_channel,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!error && data) {
        memorySettings = {
          id: data.id,
          reminder_days: Number(data.reminder_days),
          admin_mobile: data.admin_mobile,
          notification_channel: data.notification_channel || 'SMS',
          updated_at: data.updated_at,
        };
        return { ...memorySettings };
      }
    } catch {
      // Fallback to memory store update
    }
  }

  memorySettings = {
    ...memorySettings,
    reminder_days: validated.reminder_days,
    admin_mobile: validated.admin_mobile,
    notification_channel: validated.notification_channel,
    updated_at: new Date().toISOString(),
  };

  return { ...memorySettings };
}

/**
 * Retrieves the 3x3 minimum stock matrix across Toyo, Suka, and Patis.
 */
export async function getStockMinimumsMatrix(
  supabaseClient?: SupabaseClient
): Promise<StockMatrixProductDTO[]> {
  if (supabaseClient) {
    try {
      const { data: productsData, error: prodErr } = await supabaseClient
        .from('products')
        .select(`
          id,
          name,
          product_variants (
            id,
            product_id,
            size,
            stock_quantity,
            min_stock_level
          )
        `)
        .order('name');

      if (!prodErr && productsData && productsData.length > 0) {
        return productsData.map((p) => {
          const variantsRecord: Record<'350' | '1L' | 'gal', StockMatrixVariantDTO> = {
            '350': {
              variant_id: '',
              product_id: p.id,
              product_name: p.name,
              size: '350',
              stock_quantity: 0,
              min_stock_level: 0,
              is_low_stock: false,
            },
            '1L': {
              variant_id: '',
              product_id: p.id,
              product_name: p.name,
              size: '1L',
              stock_quantity: 0,
              min_stock_level: 0,
              is_low_stock: false,
            },
            gal: {
              variant_id: '',
              product_id: p.id,
              product_name: p.name,
              size: 'gal',
              stock_quantity: 0,
              min_stock_level: 0,
              is_low_stock: false,
            },
          };

          const variantsList = (p.product_variants || []) as Array<{
            id: string;
            product_id: string;
            size: '350' | '1L' | 'gal';
            stock_quantity: number;
            min_stock_level: number;
          }>;

          for (const v of variantsList) {
            if (v.size in variantsRecord) {
              const stock = Number(v.stock_quantity);
              const minStock = Number(v.min_stock_level);
              variantsRecord[v.size] = {
                variant_id: v.id,
                product_id: p.id,
                product_name: p.name,
                size: v.size,
                stock_quantity: stock,
                min_stock_level: minStock,
                is_low_stock: stock <= minStock,
              };
            }
          }

          return {
            product_id: p.id,
            product_name: p.name,
            variants: variantsRecord,
          };
        });
      }
    } catch {
      // Fall through to memory store
    }
  }

  // Group memory variants into products
  const productMap = new Map<string, StockMatrixProductDTO>();

  for (const [varId, v] of Object.entries(memoryVariantMinimums)) {
    if (!productMap.has(v.product_id)) {
      productMap.set(v.product_id, {
        product_id: v.product_id,
        product_name: v.product_name,
        variants: {} as Record<'350' | '1L' | 'gal', StockMatrixVariantDTO>,
      });
    }

    const prod = productMap.get(v.product_id)!;
    prod.variants[v.size] = {
      variant_id: varId,
      product_id: v.product_id,
      product_name: v.product_name,
      size: v.size,
      stock_quantity: v.stock_quantity,
      min_stock_level: v.min_stock_level,
      is_low_stock: v.stock_quantity <= v.min_stock_level,
    };
  }

  return Array.from(productMap.values());
}

/**
 * Batch updates product variant minimum stock levels in a single operation.
 */
export async function updateBatchStockMinimums(
  items: Array<{ variant_id: string; min_stock_level: number }>,
  supabaseClient?: SupabaseClient
): Promise<boolean> {
  const validated = batchStockMinimumsSchema.parse({ items });

  if (supabaseClient) {
    try {
      const updates = validated.items.map((item) =>
        supabaseClient
          .from('product_variants')
          .update({
            min_stock_level: item.min_stock_level,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.variant_id)
      );

      await Promise.all(updates);
    } catch {
      // Continue to update memory store
    }
  }

  // Always update memory store
  for (const item of validated.items) {
    if (memoryVariantMinimums[item.variant_id]) {
      memoryVariantMinimums[item.variant_id].min_stock_level = item.min_stock_level;
    }
  }

  return true;
}

/**
 * Checks whether an unpaid sale is overdue according to the reminder threshold days.
 */
export function calculateIsOverdue(
  sale: { total_amount: number; amount_paid: number; created_at: string | Date },
  reminderDays: number,
  now: Date = new Date()
): boolean {
  const balance = Math.max(0, sale.total_amount - sale.amount_paid);
  if (balance <= 0) return false;

  const saleDate = typeof sale.created_at === 'string' ? new Date(sale.created_at) : sale.created_at;
  const diffMs = now.getTime() - saleDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays >= reminderDays;
}

/**
 * Formats the sample reminder message text matching the mockup.
 */
export function formatReminderSampleMessage(
  customerName: string,
  amountOwed: number,
  receiptNo: string,
  days: number
): string {
  const formattedAmount = amountOwed.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `ARLQ: ${customerName} still owes ₱${formattedAmount} for receipt ${receiptNo}. Unpaid for ${days} days. Reminders stop once the sale is marked Paid.`;
}
