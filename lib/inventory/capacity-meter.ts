import type {
  PackagingSize,
  StockHealthStatus,
  BadgeVariant,
  VariantCapacityEvaluation,
} from './types.ts';

export function formatPackagingSize(size: PackagingSize | string): string {
  switch (size) {
    case '350':
      return '350 ml';
    case '1L':
      return '1 L';
    case 'gal':
      return '1 gal';
    default:
      return size;
  }
}

/**
 * Computes capacity percentage, status badge, and deficit based on ARLQ domain rules.
 *
 * Formula:
 * - Percentage: Math.min(stock / (min * 2.5) * 100, 100)%
 * - If min === 0: 100% when stock > 0, 0% when stock === 0
 * - Status:
 *   - stock === 0: 'out-of-stock', 'Out of stock', 'bad', isLow = true
 *   - stock <= min: 'low-stock', 'Low stock', 'warn', isLow = true
 *   - stock <= min * 1.4: 'getting-low', 'Getting low', 'warn', isLow = false
 *   - stock > min * 1.4: 'in-stock', 'In stock', 'ok', isLow = false
 * - shortBy: Math.max(0, min - stock)
 */
export function computeCapacityMeter(
  stock: number,
  min: number
): VariantCapacityEvaluation {
  const safeStock = Math.max(0, Math.floor(stock));
  const safeMin = Math.max(0, Math.floor(min));

  const isOut = safeStock === 0;
  const isLow = safeStock > 0 && safeStock <= safeMin;
  const isGettingLow = safeStock > safeMin && safeStock <= safeMin * 1.4;

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

  let percentage = 0;
  if (safeMin > 0) {
    const rawPct = (safeStock / (safeMin * 2.5)) * 100;
    percentage = Math.max(0, Math.min(100, Math.round(rawPct)));
  } else {
    percentage = safeStock > 0 ? 100 : 0;
  }

  const shortBy = Math.max(0, safeMin - safeStock);

  return {
    percentage,
    isLow: isOut || isLow,
    status,
    statusLabel,
    statusVariant,
    shortBy,
  };
}
