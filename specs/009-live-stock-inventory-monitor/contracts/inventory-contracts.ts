import { z } from 'zod';

export const PackagingSizeSchema = z.enum(['350', '1L', 'gal']);
export type PackagingSize = z.infer<typeof PackagingSizeSchema>;

export const StockHealthStatusSchema = z.enum([
  'out-of-stock',
  'low-stock',
  'getting-low',
  'in-stock',
]);
export type StockHealthStatus = z.infer<typeof StockHealthStatusSchema>;

export const BadgeVariantSchema = z.enum(['bad', 'warn', 'ok']);
export type BadgeVariant = z.infer<typeof BadgeVariantSchema>;

export const InventoryVariantSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  productName: z.string().min(1),
  categoryName: z.string().nullable().optional(),
  size: PackagingSizeSchema,
  sizeLabel: z.string().min(1),
  costPrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
  stockQuantity: z.number().int().nonnegative(),
  minStockLevel: z.number().int().nonnegative(),
  updatedAt: z.string(),
});
export type InventoryVariant = z.infer<typeof InventoryVariantSchema>;

export const VariantCapacityEvaluationSchema = z.object({
  percentage: z.number().min(0).max(100),
  isLow: z.boolean(),
  status: StockHealthStatusSchema,
  statusLabel: z.string(),
  statusVariant: BadgeVariantSchema,
  shortBy: z.number().int().nonnegative(),
});
export type VariantCapacityEvaluation = z.infer<typeof VariantCapacityEvaluationSchema>;

export function formatPackagingSize(size: PackagingSize): string {
  switch (size) {
    case '350':
      return '350 ml';
    case '1L':
      return '1 L';
    case 'gal':
      return '1 gal';
  }
}

export function computeCapacityMeter(
  stock: number,
  min: number
): VariantCapacityEvaluation {
  const isOut = stock === 0;
  const isLow = stock > 0 && stock <= min;
  const isGettingLow = stock > min && stock <= min * 1.4;

  let status: StockHealthStatus = 'in-stock';
  let statusLabel = 'In stock';
  let statusVariant: BadgeVariant = 'ok';

  if (isOut) {
    status = 'out-of-stock';
    statusLabel = 'Out of stock';
    statusVariant = 'bad';
  } else if (isLow) {
    status = 'low-stock';
    statusLabel = 'Low stock';
    statusVariant = 'warn';
  } else if (isGettingLow) {
    status = 'getting-low';
    statusLabel = 'Getting low';
    statusVariant = 'warn';
  }

  const baseline = min > 0 ? min * 2.5 : 100;
  const rawPct = (stock / baseline) * 100;
  const percentage = Math.max(0, Math.min(100, Math.round(rawPct)));
  const shortBy = Math.max(0, min - stock);

  return {
    percentage,
    isLow: isOut || isLow,
    status,
    statusLabel,
    statusVariant,
    shortBy,
  };
}
