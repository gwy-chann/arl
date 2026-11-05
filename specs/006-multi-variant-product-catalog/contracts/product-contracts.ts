/**
 * Component and API Contracts: Multi-Variant Product Catalog & Pricing Engine
 * Feature: ARL-8 (006-multi-variant-product-catalog)
 */

import { z } from 'zod';

export const PRODUCT_SIZES = [
  { key: '350', label: '350 ml' },
  { key: '1L', label: '1 L' },
  { key: 'gal', label: '1 gal' },
] as const;

export type ProductSizeKey = (typeof PRODUCT_SIZES)[number]['key'];

export function getSizeLabel(sizeKey: string): string {
  const match = PRODUCT_SIZES.find((s) => s.key === sizeKey);
  return match ? match.label : sizeKey;
}

export function formatPeso(amount: number): string {
  return (
    '₱' +
    amount.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function computeUnitProfit(sellingPrice: number, costPrice: number): number {
  return Number((sellingPrice - costPrice).toFixed(2));
}

// Zod Schema for Variant Input
export const variantInputSchema = z.object({
  size: z.enum(['350', '1L', 'gal'] as const),
  cost_price: z
    .number()
    .min(0, 'Cost price must be greater than or equal to 0'),
  selling_price: z
    .number()
    .min(0, 'Selling price must be greater than or equal to 0'),
  min_stock_level: z
    .number()
    .int('Minimum stock must be an integer')
    .min(0, 'Minimum stock must be 0 or greater'),
  opening_stock: z
    .number()
    .int('Opening stock must be an integer')
    .min(0, 'Opening stock must be 0 or greater')
    .optional(),
});

// Zod Schema for Product Creation / Update
export const productInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Product name is required')
    .max(100, 'Product name must not exceed 100 characters'),
  category_id: z.string().nullable().optional(),
  variants: z
    .array(variantInputSchema)
    .length(3, 'Each product must have exactly 3 size variants (350ml, 1L, 1gal)'),
});

export type VariantInput = z.infer<typeof variantInputSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;

export interface ProductVariantDTO {
  id: string;
  product_id: string;
  size: ProductSizeKey;
  cost_price: number;
  selling_price: number;
  unit_profit: number;
  stock_quantity: number;
  min_stock_level: number;
  created_at: string;
  updated_at: string;
}

export interface ProductWithVariants {
  id: string;
  name: string;
  category_id: string | null;
  category_name?: string | null;
  variants: ProductVariantDTO[];
  created_at: string;
  updated_at: string;
}

/**
 * Returns the standard deletion safeguard prompt options conforming to ARL-8 Scenario 4.
 */
export function getDeleteProductPrompt(productName: string): {
  title: string;
  message: string;
  confirmLabel: string;
  variant: 'danger';
} {
  return {
    title: `Delete ${productName}?`,
    message: `This removes ${productName} and its three sizes from the product list. Past sales stay in the records.`,
    confirmLabel: 'Delete product',
    variant: 'danger',
  };
}
