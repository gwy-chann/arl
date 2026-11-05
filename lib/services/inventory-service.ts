import type { SupabaseClient } from '@supabase/supabase-js';
import type { InventoryVariant, PackagingSize } from '../inventory/types.ts';
import { formatPackagingSize } from '../inventory/capacity-meter.ts';

interface SupabaseVariantRow {
  id: string;
  product_id: string;
  size: string;
  cost_price: number | string;
  selling_price: number | string;
  stock_quantity: number;
  min_stock_level: number;
  updated_at: string;
  products?: {
    name: string;
    categories?: {
      name: string;
    } | null;
  } | null;
}

const SAMPLE_INVENTORY: InventoryVariant[] = [
  // Toyo
  {
    id: 'toyo-350',
    productId: 'prod-toyo',
    productName: 'Toyo',
    categoryName: 'Soy sauce',
    size: '350',
    sizeLabel: '350 ml',
    costPrice: 14.0,
    sellingPrice: 20.0,
    stockQuantity: 96,
    minStockLevel: 48,
    updatedAt: new Date('2026-10-01T00:00:00.000Z').toISOString(),
  },
  {
    id: 'toyo-1L',
    productId: 'prod-toyo',
    productName: 'Toyo',
    categoryName: 'Soy sauce',
    size: '1L',
    sizeLabel: '1 L',
    costPrice: 38.0,
    sellingPrice: 50.0,
    stockQuantity: 58,
    minStockLevel: 30,
    updatedAt: new Date('2026-10-01T00:00:00.000Z').toISOString(),
  },
  {
    id: 'toyo-gal',
    productId: 'prod-toyo',
    productName: 'Toyo',
    categoryName: 'Soy sauce',
    size: 'gal',
    sizeLabel: '1 gal',
    costPrice: 125.0,
    sellingPrice: 160.0,
    stockQuantity: 17,
    minStockLevel: 12,
    updatedAt: new Date('2026-10-01T00:00:00.000Z').toISOString(),
  },
  // Suka
  {
    id: 'suka-350',
    productId: 'prod-suka',
    productName: 'Suka',
    categoryName: 'Vinegar',
    size: '350',
    sizeLabel: '350 ml',
    costPrice: 11.0,
    sellingPrice: 16.0,
    stockQuantity: 72,
    minStockLevel: 48,
    updatedAt: new Date('2026-10-01T00:00:00.000Z').toISOString(),
  },
  {
    id: 'suka-1L',
    productId: 'prod-suka',
    productName: 'Suka',
    categoryName: 'Vinegar',
    size: '1L',
    sizeLabel: '1 L',
    costPrice: 30.0,
    sellingPrice: 42.0,
    stockQuantity: 34,
    minStockLevel: 24,
    updatedAt: new Date('2026-10-01T00:00:00.000Z').toISOString(),
  },
  {
    id: 'suka-gal',
    productId: 'prod-suka',
    productName: 'Suka',
    categoryName: 'Vinegar',
    size: 'gal',
    sizeLabel: '1 gal',
    costPrice: 100.0,
    sellingPrice: 135.0,
    stockQuantity: 6,
    minStockLevel: 12,
    updatedAt: new Date('2026-10-01T00:00:00.000Z').toISOString(),
  },
  // Patis
  {
    id: 'patis-350',
    productId: 'prod-patis',
    productName: 'Patis',
    categoryName: 'Fish sauce',
    size: '350',
    sizeLabel: '350 ml',
    costPrice: 18.0,
    sellingPrice: 25.0,
    stockQuantity: 21,
    minStockLevel: 36,
    updatedAt: new Date('2026-10-01T00:00:00.000Z').toISOString(),
  },
  {
    id: 'patis-1L',
    productId: 'prod-patis',
    productName: 'Patis',
    categoryName: 'Fish sauce',
    size: '1L',
    sizeLabel: '1 L',
    costPrice: 48.0,
    sellingPrice: 62.0,
    stockQuantity: 40,
    minStockLevel: 24,
    updatedAt: new Date('2026-10-01T00:00:00.000Z').toISOString(),
  },
  {
    id: 'patis-gal',
    productId: 'prod-patis',
    productName: 'Patis',
    categoryName: 'Fish sauce',
    size: 'gal',
    sizeLabel: '1 gal',
    costPrice: 160.0,
    sellingPrice: 200.0,
    stockQuantity: 14,
    minStockLevel: 12,
    updatedAt: new Date('2026-10-01T00:00:00.000Z').toISOString(),
  },
];

let inMemoryInventory: InventoryVariant[] = JSON.parse(
  JSON.stringify(SAMPLE_INVENTORY)
);

export function resetInMemoryInventory(): void {
  inMemoryInventory = [];
}

export function seedSampleInventory(): void {
  inMemoryInventory = JSON.parse(JSON.stringify(SAMPLE_INVENTORY));
}

export class InventoryService {
  private readonly supabase?: SupabaseClient | null;

  constructor(supabase?: SupabaseClient | null) {
    this.supabase = supabase;
  }

  /**
   * Retrieves all product variants joined with product and category info.
   */
  async getInventoryVariants(): Promise<InventoryVariant[]> {
    if (!this.supabase) {
      return [...inMemoryInventory];
    }

    try {
      const { data, error } = await this.supabase
        .from('product_variants')
        .select(`
          id,
          product_id,
          size,
          cost_price,
          selling_price,
          stock_quantity,
          min_stock_level,
          updated_at,
          products (
            name,
            categories ( name )
          )
        `)
        .order('product_id', { ascending: true })
        .order('size', { ascending: true });

      if (error || !data) {
        return [...inMemoryInventory];
      }

      const rows = data as unknown as SupabaseVariantRow[];
      return rows.map((r) => {
        const size = r.size as PackagingSize;
        return {
          id: r.id,
          productId: r.product_id,
          productName: r.products?.name ?? 'Unknown',
          categoryName: r.products?.categories?.name ?? null,
          size,
          sizeLabel: formatPackagingSize(size),
          costPrice: Number(r.cost_price),
          sellingPrice: Number(r.selling_price),
          stockQuantity: r.stock_quantity ?? 0,
          minStockLevel: r.min_stock_level ?? 0,
          updatedAt: r.updated_at,
        };
      });
    } catch {
      return [...inMemoryInventory];
    }
  }

  /**
   * Retrieves only variants at or below minimum stock level.
   */
  async getLowStockVariants(): Promise<InventoryVariant[]> {
    const all = await this.getInventoryVariants();
    return all.filter((v) => v.stockQuantity <= v.minStockLevel);
  }

  /**
   * Updates variant stock quantity (useful for tests and realtime actions).
   */
  async updateVariantStock(
    variantId: string,
    newStock: number
  ): Promise<InventoryVariant> {
    const safeStock = Math.max(0, Math.floor(newStock));

    if (!this.supabase) {
      const idx = inMemoryInventory.findIndex((v) => v.id === variantId);
      if (idx === -1) {
        throw new Error(`Variant ${variantId} not found`);
      }
      inMemoryInventory[idx] = {
        ...inMemoryInventory[idx],
        stockQuantity: safeStock,
        updatedAt: new Date().toISOString(),
      };
      return inMemoryInventory[idx];
    }

    const { data, error } = await this.supabase
      .from('product_variants')
      .update({
        stock_quantity: safeStock,
        updated_at: new Date().toISOString(),
      })
      .eq('id', variantId)
      .select(`
        id,
        product_id,
        size,
        cost_price,
        selling_price,
        stock_quantity,
        min_stock_level,
        updated_at,
        products (
          name,
          categories ( name )
        )
      `)
      .single();

    if (error || !data) {
      throw new Error(error?.message || `Failed to update variant stock for ${variantId}`);
    }

    const row = data as unknown as SupabaseVariantRow;
    const size = row.size as PackagingSize;
    return {
      id: row.id,
      productId: row.product_id,
      productName: row.products?.name ?? 'Unknown',
      categoryName: row.products?.categories?.name ?? null,
      size,
      sizeLabel: formatPackagingSize(size),
      costPrice: Number(row.cost_price),
      sellingPrice: Number(row.selling_price),
      stockQuantity: row.stock_quantity ?? 0,
      minStockLevel: row.min_stock_level ?? 0,
      updatedAt: row.updated_at,
    };
  }
}
