export type PackagingSize = '350' | '1L' | 'gal';

export type StockHealthStatus = 'out-of-stock' | 'low-stock' | 'getting-low' | 'in-stock';

export type BadgeVariant = 'bad' | 'warn' | 'ok';

export interface InventoryVariant {
  id: string;
  productId: string;
  productName: string;
  categoryName: string | null;
  size: PackagingSize;
  sizeLabel: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  updatedAt: string;
}

export interface VariantCapacityEvaluation {
  percentage: number;
  isLow: boolean;
  status: StockHealthStatus;
  statusLabel: string;
  statusVariant: BadgeVariant;
  shortBy: number;
}
