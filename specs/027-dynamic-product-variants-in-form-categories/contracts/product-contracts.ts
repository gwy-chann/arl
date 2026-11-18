/**
 * Component and API Contracts: In-Form Category Creation & Dynamic Product Variant Management
 * Feature: ARL-38 (027-dynamic-product-variants-in-form-categories)
 */

import { z } from 'zod';

export const PRODUCT_SIZES = [
  { key: '350', label: '350 ml' },
  { key: '1L', label: '1 L' },
  { key: 'gal', label: '1 gal' },
] as const;

export type ProductSizeKey = (typeof PRODUCT_SIZES)[number]['key'] | string;

export function getSizeLabel(sizeKey: string): string {
  const match = PRODUCT_SIZES.find((s) => s.key === sizeKey || s.label.toLowerCase() === sizeKey.toLowerCase());
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

// Zod Schema for Dynamic Variant Input
export const variantInputSchema = z.object({
  id: z.string().optional(),
  size: z
    .string()
    .trim()
    .min(1, 'Variant size label is required')
    .max(50, 'Size label must not exceed 50 characters'),
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

// Zod Schema for Product Creation / Update with dynamic variants and duplicate prevention
export const productInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Product name is required')
    .max(100, 'Product name must not exceed 100 characters'),
  category_id: z.string().nullable().optional(),
  variants: z
    .array(variantInputSchema)
    .min(1, 'Each product must have at least one variant')
    .refine(
      (items) => {
        const sizes = items.map((i) => i.size.trim().toLowerCase());
        return new Set(sizes).size === sizes.length;
      },
      {
        message: 'Variant sizes must be unique for each product',
        path: ['variants'],
      }
    ),
});

export type VariantInput = z.infer<typeof variantInputSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;

export interface ProductVariantDTO {
  id: string;
  product_id: string;
  size: string;
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

export function getDeleteProductPrompt(productName: string): {
  title: string;
  message: string;
  confirmLabel: string;
  variant: 'danger';
} {
  return {
    title: `Delete ${productName}?`,
    message: `This removes ${productName} and its packaging variants from the product list. Past sales stay in the records.`,
    confirmLabel: 'Delete product',
    variant: 'danger',
  };
}
