import type { SupabaseClient } from '@supabase/supabase-js';
import {
  computeUnitProfit,
  productInputSchema,
  type ProductSizeKey,
  type ProductVariantDTO,
  type ProductWithVariants,
} from '../../specs/006-multi-variant-product-catalog/contracts/product-contracts.ts';

export type { ProductWithVariants, ProductVariantDTO, ProductSizeKey };

export interface CreateProductInput {
  name: string;
  category_id?: string | null;
  variants: {
    size: ProductSizeKey;
    cost_price: number;
    selling_price: number;
    min_stock_level: number;
    opening_stock?: number;
  }[];
}

export interface UpdateProductInput {
  id: string;
  name: string;
  category_id?: string | null;
  variants: {
    size: ProductSizeKey;
    cost_price: number;
    selling_price: number;
    min_stock_level: number;
    opening_stock?: number;
  }[];
}

interface SupabaseVariantRow {
  id: string;
  product_id: string;
  size: string;
  cost_price: number | string;
  selling_price: number | string;
  stock_quantity: number;
  min_stock_level: number;
  created_at: string;
  updated_at: string;
}

interface SupabaseProductRow {
  id: string;
  name: string;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  categories?: { name: string } | null;
  product_variants?: SupabaseVariantRow[] | null;
}

// In-memory baseline store matching ARLQ domain model
const INITIAL_PRODUCTS: ProductWithVariants[] = [
  {
    id: 'prod-toyo',
    name: 'Toyo',
    category_id: 'cat-1',
    category_name: 'Soy Sauce',
    created_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
    updated_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
    variants: [
      {
        id: 'toyo-350',
        product_id: 'prod-toyo',
        size: '350',
        cost_price: 14.0,
        selling_price: 20.0,
        unit_profit: 6.0,
        stock_quantity: 96,
        min_stock_level: 48,
        created_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
        updated_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
      },
      {
        id: 'toyo-1L',
        product_id: 'prod-toyo',
        size: '1L',
        cost_price: 38.0,
        selling_price: 50.0,
        unit_profit: 12.0,
        stock_quantity: 58,
        min_stock_level: 30,
        created_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
        updated_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
      },
      {
        id: 'toyo-gal',
        product_id: 'prod-toyo',
        size: 'gal',
        cost_price: 125.0,
        selling_price: 160.0,
        unit_profit: 35.0,
        stock_quantity: 17,
        min_stock_level: 12,
        created_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
        updated_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
      },
    ],
  },
  {
    id: 'prod-suka',
    name: 'Suka',
    category_id: 'cat-2',
    category_name: 'Vinegar',
    created_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
    updated_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
    variants: [
      {
        id: 'suka-350',
        product_id: 'prod-suka',
        size: '350',
        cost_price: 11.0,
        selling_price: 16.0,
        unit_profit: 5.0,
        stock_quantity: 72,
        min_stock_level: 48,
        created_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
        updated_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
      },
      {
        id: 'suka-1L',
        product_id: 'prod-suka',
        size: '1L',
        cost_price: 30.0,
        selling_price: 42.0,
        unit_profit: 12.0,
        stock_quantity: 34,
        min_stock_level: 24,
        created_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
        updated_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
      },
      {
        id: 'suka-gal',
        product_id: 'prod-suka',
        size: 'gal',
        cost_price: 100.0,
        selling_price: 135.0,
        unit_profit: 35.0,
        stock_quantity: 6,
        min_stock_level: 12,
        created_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
        updated_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
      },
    ],
  },
  {
    id: 'prod-patis',
    name: 'Patis',
    category_id: 'cat-3',
    category_name: 'Fish Sauce',
    created_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
    updated_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
    variants: [
      {
        id: 'patis-350',
        product_id: 'prod-patis',
        size: '350',
        cost_price: 18.0,
        selling_price: 25.0,
        unit_profit: 7.0,
        stock_quantity: 21,
        min_stock_level: 36,
        created_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
        updated_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
      },
      {
        id: 'patis-1L',
        product_id: 'prod-patis',
        size: '1L',
        cost_price: 48.0,
        selling_price: 62.0,
        unit_profit: 14.0,
        stock_quantity: 40,
        min_stock_level: 24,
        created_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
        updated_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
      },
      {
        id: 'patis-gal',
        product_id: 'prod-patis',
        size: 'gal',
        cost_price: 160.0,
        selling_price: 200.0,
        unit_profit: 40.0,
        stock_quantity: 14,
        min_stock_level: 12,
        created_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
        updated_at: new Date('2026-10-01T00:00:00.000Z').toISOString(),
      },
    ],
  },
];

let inMemoryProducts: ProductWithVariants[] = JSON.parse(
  JSON.stringify(INITIAL_PRODUCTS)
);

export function resetInMemoryProducts(): void {
  inMemoryProducts = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
}

function mapVariantRow(row: SupabaseVariantRow): ProductVariantDTO {
  const cost = Number(row.cost_price);
  const price = Number(row.selling_price);
  return {
    id: row.id,
    product_id: row.product_id,
    size: row.size as ProductSizeKey,
    cost_price: cost,
    selling_price: price,
    unit_profit: computeUnitProfit(price, cost),
    stock_quantity: row.stock_quantity ?? 0,
    min_stock_level: row.min_stock_level ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function normalizeSizeKey(s: string): string {
  const lower = s.trim().toLowerCase();
  if (lower === '350' || lower === '350 ml' || lower === '350ml') return '350';
  if (lower === '1l' || lower === '1 l' || lower === '1 liter' || lower === '1liter') return '1L';
  if (lower === 'gal' || lower === '1 gal' || lower === '1gal' || lower === '1 gallon' || lower === 'gallon') return 'gal';
  return s.trim();
}

function sortVariants(variants: ProductVariantDTO[]): ProductVariantDTO[] {
  const order: Record<string, number> = { '350': 0, '1L': 1, gal: 2 };
  return [...variants].sort(
    (a, b) => (order[normalizeSizeKey(a.size)] ?? 99) - (order[normalizeSizeKey(b.size)] ?? 99)
  );
}

export class ProductService {
  private readonly supabase?: SupabaseClient | null;

  constructor(supabase?: SupabaseClient | null) {
    this.supabase = supabase;
  }

  /**
   * Retrieves all products with their associated variants and categories.
   */
  async getProducts(): Promise<ProductWithVariants[]> {
    if (!this.supabase) {
      return [...inMemoryProducts];
    }

    try {
      const { data, error } = await this.supabase
        .from('products')
        .select(`
          id,
          name,
          category_id,
          created_at,
          updated_at,
          categories ( name ),
          product_variants (
            id,
            product_id,
            size,
            cost_price,
            selling_price,
            stock_quantity,
            min_stock_level,
            created_at,
            updated_at
          )
        `)
        .order('name', { ascending: true });

      if (error || !data) {
        console.warn('Supabase products fetch error:', error);
        return [];
      }

      return (data as unknown as SupabaseProductRow[]).map((p) => {
        const variants = (p.product_variants || []).map(mapVariantRow);
        return {
          id: p.id,
          name: p.name,
          category_id: p.category_id,
          category_name: p.categories?.name ?? null,
          variants: sortVariants(variants),
          created_at: p.created_at,
          updated_at: p.updated_at,
        };
      });
    } catch (err) {
      console.warn('Supabase products fetch exception:', err);
      return [];
    }
  }

  /**
   * Retrieves a specific product by ID.
   */
  async getProductById(id: string): Promise<ProductWithVariants | null> {
    if (!this.supabase) {
      return inMemoryProducts.find((p) => p.id === id) ?? null;
    }

    try {
      const { data, error } = await this.supabase
        .from('products')
        .select(`
          id,
          name,
          category_id,
          created_at,
          updated_at,
          categories ( name ),
          product_variants (
            id,
            product_id,
            size,
            cost_price,
            selling_price,
            stock_quantity,
            min_stock_level,
            created_at,
            updated_at
          )
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        return null;
      }

      const p = data as unknown as SupabaseProductRow;
      const variants = (p.product_variants || []).map(mapVariantRow);

      return {
        id: p.id,
        name: p.name,
        category_id: p.category_id,
        category_name: p.categories?.name ?? null,
        variants: sortVariants(variants),
        created_at: p.created_at,
        updated_at: p.updated_at,
      };
    } catch {
      return null;
    }
  }

  /**
   * Retrieves a product by name (case-insensitive).
   */
  async getProductByName(name: string): Promise<ProductWithVariants | null> {
    const trimmed = name.trim().toLowerCase();
    if (!this.supabase) {
      return (
        inMemoryProducts.find((p) => p.name.trim().toLowerCase() === trimmed) ||
        null
      );
    }

    try {
      const { data, error } = await this.supabase
        .from('products')
        .select('id')
        .ilike('name', name.trim())
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return (
          inMemoryProducts.find(
            (p) => p.name.trim().toLowerCase() === trimmed
          ) || null
        );
      }

      return await this.getProductById(data.id);
    } catch {
      return (
        inMemoryProducts.find((p) => p.name.trim().toLowerCase() === trimmed) ||
        null
      );
    }
  }

  /**
   * Atomically creates a new product and its packaging variants.
   * If a product with the same name already exists, merges/adds the new variants into it.
   */
  async createProduct(input: CreateProductInput): Promise<ProductWithVariants> {
    const validated = productInputSchema.parse(input);

    // If a product with this name already exists, add/merge variants into it
    const existing = await this.getProductByName(validated.name);
    if (existing) {
      const existingNormalized = new Set(
        existing.variants.map((ev) => normalizeSizeKey(ev.size).toLowerCase())
      );

      const mergedVariants = [
        ...existing.variants.map((ev) => ({
          id: ev.id,
          size: ev.size,
          cost_price: ev.cost_price,
          selling_price: ev.selling_price,
          min_stock_level: ev.min_stock_level,
          opening_stock: ev.stock_quantity,
        })),
        ...validated.variants.filter(
          (nv) =>
            !existingNormalized.has(normalizeSizeKey(nv.size).toLowerCase())
        ),
      ];

      return await this.updateProduct({
        id: existing.id,
        name: existing.name,
        category_id: validated.category_id ?? existing.category_id,
        variants: mergedVariants,
      });
    }

    if (!this.supabase) {
      const newId = `prod-${Date.now()}`;
      const now = new Date().toISOString();
      const variants: ProductVariantDTO[] = validated.variants.map((v) => {
        const cost = Number(v.cost_price);
        const price = Number(v.selling_price);
        return {
          id: `var-${newId}-${v.size}`,
          product_id: newId,
          size: v.size as ProductSizeKey,
          cost_price: cost,
          selling_price: price,
          unit_profit: computeUnitProfit(price, cost),
          stock_quantity: v.opening_stock ?? 0,
          min_stock_level: v.min_stock_level ?? 0,
          created_at: now,
          updated_at: now,
        };
      });

      const newProduct: ProductWithVariants = {
        id: newId,
        name: validated.name,
        category_id: validated.category_id ?? null,
        category_name: null,
        variants: sortVariants(variants),
        created_at: now,
        updated_at: now,
      };

      inMemoryProducts.push(newProduct);
      return newProduct;
    }

    try {
      // 1. Insert product record
      const { data: prodData, error: prodError } = await this.supabase
        .from('products')
        .insert({
          name: validated.name,
          category_id: validated.category_id || null,
        })
        .select('id, name, category_id, created_at, updated_at')
        .single();

      if (prodError || !prodData) {
        throw new Error(prodError?.message || 'Failed to create product');
      }

      // 2. Insert 3 variant records
      const variantInserts = validated.variants.map((v) => ({
        product_id: prodData.id,
        size: v.size,
        cost_price: v.cost_price,
        selling_price: v.selling_price,
        stock_quantity: v.opening_stock ?? 0,
        min_stock_level: v.min_stock_level,
      }));

      const { data: varData, error: varError } = await this.supabase
        .from('product_variants')
        .insert(variantInserts)
        .select('*');

      if (varError || !varData) {
        // Rollback product insert if variants fail
        await this.supabase.from('products').delete().eq('id', prodData.id);
        throw new Error(varError?.message || 'Failed to create product variants');
      }

      const variants = (varData as unknown as SupabaseVariantRow[]).map(mapVariantRow);

      const createdProduct: ProductWithVariants = {
        id: prodData.id,
        name: prodData.name,
        category_id: prodData.category_id,
        category_name: null,
        variants: sortVariants(variants),
        created_at: prodData.created_at,
        updated_at: prodData.updated_at,
      };

      inMemoryProducts.push(createdProduct);
      return createdProduct;
    } catch {
      // In-memory fallback if database transaction fails
      const newId = `prod-${Date.now()}`;
      const now = new Date().toISOString();
      const variants: ProductVariantDTO[] = validated.variants.map((v) => {
        const cost = Number(v.cost_price);
        const price = Number(v.selling_price);
        return {
          id: `var-${newId}-${v.size}`,
          product_id: newId,
          size: v.size as ProductSizeKey,
          cost_price: cost,
          selling_price: price,
          unit_profit: computeUnitProfit(price, cost),
          stock_quantity: v.opening_stock ?? 0,
          min_stock_level: v.min_stock_level ?? 0,
          created_at: now,
          updated_at: now,
        };
      });

      const fallbackProduct: ProductWithVariants = {
        id: newId,
        name: validated.name,
        category_id: validated.category_id ?? null,
        category_name: null,
        variants: sortVariants(variants),
        created_at: now,
        updated_at: now,
      };

      inMemoryProducts.push(fallbackProduct);
      return fallbackProduct;
    }
  }

  /**
   * Updates an existing product and its packaging variants.
   */
  async updateProduct(input: UpdateProductInput): Promise<ProductWithVariants> {
    const validated = productInputSchema.parse({
      name: input.name,
      category_id: input.category_id,
      variants: input.variants,
    });

    if (!this.supabase) {
      const existing = inMemoryProducts.find((p) => p.id === input.id);
      if (!existing) {
        throw new Error(`Product with ID "${input.id}" not found`);
      }

      const now = new Date().toISOString();
      existing.name = validated.name;
      existing.category_id = validated.category_id ?? null;
      existing.updated_at = now;

      existing.variants = sortVariants(
        validated.variants.map((v) => {
          let oldVar = v.id ? existing.variants.find((ov) => ov.id === v.id) : undefined;
          if (!oldVar) {
            oldVar = existing.variants.find(
              (ov) =>
                ov.size.toLowerCase().trim() === v.size.toLowerCase().trim() ||
                normalizeSizeKey(ov.size).toLowerCase() === normalizeSizeKey(v.size).toLowerCase()
            );
          }
          const cost = Number(v.cost_price);
          const price = Number(v.selling_price);
          return {
            id: oldVar ? oldVar.id : `var-${existing.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            product_id: existing.id,
            size: v.size as ProductSizeKey,
            cost_price: cost,
            selling_price: price,
            unit_profit: computeUnitProfit(price, cost),
            stock_quantity: oldVar ? oldVar.stock_quantity : (v.opening_stock ?? 0),
            min_stock_level: v.min_stock_level ?? 0,
            created_at: oldVar ? oldVar.created_at : now,
            updated_at: now,
          };
        })
      );

      return existing;
    }

    try {
      // 1. Update product table
      const { data: prodData, error: prodError } = await this.supabase
        .from('products')
        .update({
          name: validated.name,
          category_id: validated.category_id || null,
        })
        .eq('id', input.id)
        .select('id, name, category_id, created_at, updated_at')
        .single();

      if (prodError || !prodData) {
        throw new Error(prodError?.message || 'Failed to update product');
      }

      // 2. Query existing variants for product
      const { data: existingVariantsData } = await this.supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', input.id);

      const existingById = new Map(
        (existingVariantsData || []).map((row) => [row.id, row])
      );
      const existingBySize = new Map(
        (existingVariantsData || []).map((row) => [normalizeSizeKey(row.size).toLowerCase(), row])
      );

      const matchedOldIds = new Set<string>();

      // 3. Upsert / Insert / Update variants
      for (const v of validated.variants) {
        let existingRow = v.id ? existingById.get(v.id) : undefined;
        if (!existingRow) {
          existingRow = existingBySize.get(normalizeSizeKey(v.size).toLowerCase());
        }

        if (existingRow) {
          matchedOldIds.add(existingRow.id);
          await this.supabase
            .from('product_variants')
            .update({
              size: v.size.trim(),
              cost_price: v.cost_price,
              selling_price: v.selling_price,
              min_stock_level: v.min_stock_level,
            })
            .eq('id', existingRow.id);
        } else {
          await this.supabase
            .from('product_variants')
            .insert({
              product_id: input.id,
              size: v.size.trim(),
              cost_price: v.cost_price,
              selling_price: v.selling_price,
              stock_quantity: v.opening_stock ?? 0,
              min_stock_level: v.min_stock_level,
            });
        }
      }

      // 4. Safely remove variants that were deleted from form (if not referenced by sales items)
      for (const oldRow of existingVariantsData || []) {
        if (!matchedOldIds.has(oldRow.id)) {
          try {
            await this.supabase
              .from('product_variants')
              .delete()
              .eq('id', oldRow.id);
          } catch {
            // Retain row if foreign key constraint (e.g. sale_items) prevents deletion
          }
        }
      }

      const updated = await this.getProductById(input.id);
      if (!updated) {
        throw new Error('Failed to retrieve updated product');
      }

      const idx = inMemoryProducts.findIndex((p) => p.id === input.id);
      if (idx !== -1) inMemoryProducts[idx] = updated;

      return updated;
    } catch {
      const existing = inMemoryProducts.find((p) => p.id === input.id);
      if (!existing) {
        throw new Error(`Product with ID "${input.id}" not found`);
      }

      const now = new Date().toISOString();
      existing.name = validated.name;
      existing.category_id = validated.category_id ?? null;
      existing.updated_at = now;

      existing.variants = sortVariants(
        validated.variants.map((v) => {
          let oldVar = v.id ? existing.variants.find((ov) => ov.id === v.id) : undefined;
          if (!oldVar) {
            oldVar = existing.variants.find(
              (ov) =>
                ov.size.toLowerCase().trim() === v.size.toLowerCase().trim() ||
                normalizeSizeKey(ov.size).toLowerCase() === normalizeSizeKey(v.size).toLowerCase()
            );
          }
          const cost = Number(v.cost_price);
          const price = Number(v.selling_price);
          return {
            id: oldVar ? oldVar.id : `var-${existing.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            product_id: existing.id,
            size: v.size as ProductSizeKey,
            cost_price: cost,
            selling_price: price,
            unit_profit: computeUnitProfit(price, cost),
            stock_quantity: oldVar ? oldVar.stock_quantity : (v.opening_stock ?? 0),
            min_stock_level: v.min_stock_level ?? 0,
            created_at: oldVar ? oldVar.created_at : now,
            updated_at: now,
          };
        })
      );

      return existing;
    }
  }

  /**
   * Deletes a product and its associated variants from the active catalog.
   */
  async deleteProduct(id: string): Promise<{ success: boolean; deletedId: string }> {
    if (!this.supabase) {
      const idx = inMemoryProducts.findIndex((p) => p.id === id);
      if (idx !== -1) {
        inMemoryProducts.splice(idx, 1);
      }
      return { success: true, deletedId: id };
    }

    try {
      const { error } = await this.supabase.from('products').delete().eq('id', id);
      if (error) {
        throw new Error(error.message);
      }

      const idx = inMemoryProducts.findIndex((p) => p.id === id);
      if (idx !== -1) {
        inMemoryProducts.splice(idx, 1);
      }

      return { success: true, deletedId: id };
    } catch {
      const idx = inMemoryProducts.findIndex((p) => p.id === id);
      if (idx !== -1) {
        inMemoryProducts.splice(idx, 1);
      }
      return { success: true, deletedId: id };
    }
  }

  /**
   * Retrieves a product variant by its unique ID across all products.
   */
  async getVariantById(
    variantId: string
  ): Promise<{ product: ProductWithVariants; variant: ProductVariantDTO } | null> {
    const products = await this.getProducts();
    for (const p of products) {
      const v = p.variants.find((variant) => variant.id === variantId);
      if (v) {
        return { product: p, variant: v };
      }
    }
    return null;
  }

  /**
   * Adjusts a variant's stock quantity by delta (positive or negative).
   * Prevents stock quantity from falling below 0.
   */
  async adjustVariantStock(
    variantId: string,
    delta: number
  ): Promise<{ product: ProductWithVariants; variant: ProductVariantDTO }> {
    if (!this.supabase) {
      for (const p of inMemoryProducts) {
        const v = p.variants.find((variant) => variant.id === variantId);
        if (v) {
          const nextStock = v.stock_quantity + delta;
          if (nextStock < 0) {
            throw new Error(`Insufficient stock: current stock is ${v.stock_quantity}`);
          }
          v.stock_quantity = nextStock;
          v.updated_at = new Date().toISOString();
          p.updated_at = new Date().toISOString();
          return { product: p, variant: v };
        }
      }
      throw new Error(`Variant with ID "${variantId}" not found`);
    }

    try {
      const { data: vRow, error: fetchErr } = await this.supabase
        .from('product_variants')
        .select('id, product_id, size, stock_quantity, products ( id, name, category_id )')
        .eq('id', variantId)
        .single();

      if (fetchErr || !vRow) {
        for (const p of inMemoryProducts) {
          const v = p.variants.find((variant) => variant.id === variantId);
          if (v) {
            const nextStock = v.stock_quantity + delta;
            if (nextStock < 0) {
              throw new Error(`Insufficient stock: current stock is ${v.stock_quantity}`);
            }
            v.stock_quantity = nextStock;
            return { product: p, variant: v };
          }
        }
        throw new Error(`Variant with ID "${variantId}" not found`);
      }

      const currentStock = vRow.stock_quantity ?? 0;
      const nextStock = currentStock + delta;
      if (nextStock < 0) {
        throw new Error(`Insufficient stock: current stock is ${currentStock}`);
      }

      const { data: updatedRow, error: updateErr } = await this.supabase
        .from('product_variants')
        .update({ stock_quantity: nextStock, updated_at: new Date().toISOString() })
        .eq('id', variantId)
        .select()
        .single();

      if (updateErr || !updatedRow) {
        throw new Error(updateErr?.message || 'Failed to update stock');
      }

      const fullProduct = await this.getProductById(vRow.product_id);
      if (!fullProduct) {
        throw new Error('Associated product not found');
      }
      const updatedVariant = fullProduct.variants.find((v) => v.id === variantId)!;
      return { product: fullProduct, variant: updatedVariant };
    } catch (err) {
      for (const p of inMemoryProducts) {
        const v = p.variants.find((variant) => variant.id === variantId);
        if (v) {
          const nextStock = v.stock_quantity + delta;
          if (nextStock < 0) {
            throw new Error(`Insufficient stock: current stock is ${v.stock_quantity}`);
          }
          v.stock_quantity = nextStock;
          return { product: p, variant: v };
        }
      }
      throw err;
    }
  }
}
