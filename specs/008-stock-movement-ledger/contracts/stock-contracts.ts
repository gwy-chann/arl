/**
 * Component and API Contracts: Stock-In & Stock-Out Ledger with Movement Audit
 * Feature: ARL-13 (008-stock-movement-ledger)
 */

import { z } from 'zod';

export const STOCK_IN_REASONS = [
  'Restock from warehouse',
  'Return from customer',
  'Correction',
] as const;

export const STOCK_OUT_REASONS = [
  'Damaged or spilled',
  'Sample or giveaway',
  'Used for repacking',
  'Correction',
] as const;

export type StockInReason = (typeof STOCK_IN_REASONS)[number];
export type StockOutReason = (typeof STOCK_OUT_REASONS)[number];
export type MovementType = 'In' | 'Out' | 'Sale';

export const stockMovementInputSchema = z.object({
  variant_id: z.string().min(1, 'Please select a product variant'),
  movement_type: z.enum(['In', 'Out']),
  quantity: z
    .number({ invalid_type_error: 'Quantity must be a valid number' })
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1'),
  reason: z.string().min(1, 'Please select a reason or source'),
  note: z.string().trim().default(''),
});

export type StockMovementInput = z.infer<typeof stockMovementInputSchema>;

export interface StockMovementDTO {
  id: string;
  variant_id: string;
  movement_type: MovementType;
  quantity: number;
  reason: string;
  note: string;
  created_at: string;
}

export interface StockMovementDisplayItem {
  id: string;
  variant_id: string;
  movement_type: MovementType;
  quantity: number;
  reason: string;
  note: string;
  created_at: string;
  product_name: string;
  size: string;
  variant_label: string;
  display_note: string;
  signed_quantity: string; // "+24", "-1"
}

export interface MovementActionResult {
  success: boolean;
  movement?: StockMovementDTO;
  new_stock?: number;
  toastMessage?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export function formatSignedQuantity(type: MovementType, quantity: number): string {
  return `${type === 'In' ? '+' : '-'}${quantity}`;
}

export function formatMovementDisplayNote(reason: string, note?: string): string {
  const trimmed = note?.trim() || '';
  if (!trimmed) return reason;
  return `${reason}: ${trimmed}`;
}

export function formatMovementVariantLabel(productName: string, sizeLabel: string): string {
  return `${productName} - ${sizeLabel}`;
}

export function formatStockInSuccessToast(variantLabel: string, newStock: number): string {
  return `Stock in saved: ${variantLabel} now ${newStock}`;
}

export function formatStockOutSuccessToast(variantLabel: string, newStock: number): string {
  return `Stock out saved: ${variantLabel} now ${newStock}`;
}

export function formatInsufficientStockToast(availableStock: number): string {
  return `Only ${availableStock} in stock`;
}
