/**
 * Domain Service: Stock-In & Stock-Out Ledger with Movement Audit
 * Feature: ARL-13 (008-stock-movement-ledger)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ProductService,
  resetInMemoryProducts,
} from '../products/product-service.ts';
import { getSizeLabel } from '../../specs/006-multi-variant-product-catalog/contracts/product-contracts.ts';
import {
  stockMovementInputSchema,
  formatSignedQuantity,
  formatMovementDisplayNote,
  formatMovementVariantLabel,
  formatStockInSuccessToast,
  formatStockOutSuccessToast,
  formatInsufficientStockToast,
  type MovementActionResult,
  type MovementType,
  type StockMovementDTO,
  type StockMovementDisplayItem,
  type StockMovementInput,
} from './stock-contracts.ts';

interface SupabaseMovementRow {
  id: string;
  variant_id: string;
  movement_type: MovementType;
  quantity: number;
  reason: string;
  note: string;
  created_at: string;
}

// Canonical baseline historical movements matching ARLQ store records
function generateBaselineMovements(): StockMovementDTO[] {
  const baseTime = new Date('2026-10-01T00:00:00.000Z').getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  return [
    {
      id: 'mov-001',
      variant_id: 'toyo-1L',
      movement_type: 'Out',
      quantity: 6,
      reason: 'Sale',
      note: 'Sale ARLQ-01064',
      created_at: new Date(baseTime).toISOString(),
    },
    {
      id: 'mov-002',
      variant_id: 'suka-1L',
      movement_type: 'Out',
      quantity: 4,
      reason: 'Sale',
      note: 'Sale ARLQ-01064',
      created_at: new Date(baseTime).toISOString(),
    },
    {
      id: 'mov-003',
      variant_id: 'toyo-350',
      movement_type: 'In',
      quantity: 96,
      reason: 'Restock from warehouse',
      note: '',
      created_at: new Date(baseTime - 2 * dayMs).toISOString(),
    },
    {
      id: 'mov-004',
      variant_id: 'suka-350',
      movement_type: 'In',
      quantity: 72,
      reason: 'Restock from warehouse',
      note: '',
      created_at: new Date(baseTime - 2 * dayMs).toISOString(),
    },
    {
      id: 'mov-005',
      variant_id: 'suka-gal',
      movement_type: 'Out',
      quantity: 1,
      reason: 'Damaged or spilled',
      note: 'Damaged: cracked cap',
      created_at: new Date(baseTime - 3 * dayMs).toISOString(),
    },
    {
      id: 'mov-006',
      variant_id: 'patis-1L',
      movement_type: 'In',
      quantity: 48,
      reason: 'Restock from warehouse',
      note: '',
      created_at: new Date(baseTime - 5 * dayMs).toISOString(),
    },
    {
      id: 'mov-007',
      variant_id: 'patis-350',
      movement_type: 'Out',
      quantity: 2,
      reason: 'Sample or giveaway',
      note: 'Sample for new customer',
      created_at: new Date(baseTime - 7 * dayMs).toISOString(),
    },
    {
      id: 'mov-008',
      variant_id: 'toyo-gal',
      movement_type: 'In',
      quantity: 24,
      reason: 'Restock from warehouse',
      note: '',
      created_at: new Date(baseTime - 9 * dayMs).toISOString(),
    },
    {
      id: 'mov-009',
      variant_id: 'suka-1L',
      movement_type: 'In',
      quantity: 36,
      reason: 'Restock from warehouse',
      note: '',
      created_at: new Date(baseTime - 13 * dayMs).toISOString(),
    },
    {
      id: 'mov-010',
      variant_id: 'toyo-350',
      movement_type: 'Out',
      quantity: 3,
      reason: 'Used for repacking',
      note: 'Spilled during repack',
      created_at: new Date(baseTime - 16 * dayMs).toISOString(),
    },
    {
      id: 'mov-011',
      variant_id: 'patis-gal',
      movement_type: 'In',
      quantity: 18,
      reason: 'Restock from warehouse',
      note: '',
      created_at: new Date(baseTime - 20 * dayMs).toISOString(),
    },
    {
      id: 'mov-012',
      variant_id: 'patis-350',
      movement_type: 'In',
      quantity: 48,
      reason: 'Restock from warehouse',
      note: '',
      created_at: new Date(baseTime - 27 * dayMs).toISOString(),
    },
  ];
}

let inMemoryMovements: StockMovementDTO[] = generateBaselineMovements();

export function resetInMemoryMovements(): void {
  inMemoryMovements = generateBaselineMovements();
  resetInMemoryProducts();
}

export interface VariantStockOption {
  id: string;
  product_name: string;
  size: string;
  size_label: string;
  variant_label: string;
  stock_quantity: number;
  selector_label: string;
}

export class StockService {
  private readonly supabase?: SupabaseClient | null;
  private readonly productService: ProductService;

  constructor(supabase?: SupabaseClient | null) {
    this.supabase = supabase;
    this.productService = new ProductService(supabase);
  }

  /**
   * Records a Stock In or Stock Out movement with strict stock availability checks.
   */
  async recordMovement(input: StockMovementInput): Promise<MovementActionResult> {
    const validated = stockMovementInputSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: validated.error.flatten().fieldErrors,
      };
    }

    const { variant_id, movement_type, quantity, reason, note } = validated.data;

    // 1. Retrieve variant to verify current stock
    const variantMatch = await this.productService.getVariantById(variant_id);
    if (!variantMatch) {
      return {
        success: false,
        error: 'Product variant not found',
      };
    }

    const { product, variant } = variantMatch;
    const variantLabel = formatMovementVariantLabel(product.name, getSizeLabel(variant.size));

    // 2. Validate sufficient stock for Stock Out transactions (Scenario 3)
    if (movement_type === 'Out' && quantity > variant.stock_quantity) {
      return {
        success: false,
        error: formatInsufficientStockToast(variant.stock_quantity),
      };
    }

    // 3. Atomically adjust stock quantity
    const delta = movement_type === 'In' ? quantity : -quantity;
    let updatedVariant;
    try {
      const res = await this.productService.adjustVariantStock(variant.id, delta);
      updatedVariant = res.variant;
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update stock quantity',
      };
    }

    // 4. Record audit ledger entry
    const newMovementId = `mov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const movementRecord: StockMovementDTO = {
      id: newMovementId,
      variant_id: variant.id,
      movement_type,
      quantity,
      reason,
      note: note || '',
      created_at: new Date().toISOString(),
    };

    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('stock_movements')
          .insert({
            variant_id: variant.id,
            movement_type,
            quantity,
            reason,
            note: note || '',
          })
          .select()
          .single();

        if (!error && data) {
          movementRecord.id = data.id;
          movementRecord.created_at = data.created_at;
        }
      } catch {
        // Fallback to in-memory persistence
      }
    }

    inMemoryMovements.unshift(movementRecord);

    const toastMessage =
      movement_type === 'In'
        ? formatStockInSuccessToast(variantLabel, updatedVariant.stock_quantity)
        : formatStockOutSuccessToast(variantLabel, updatedVariant.stock_quantity);

    return {
      success: true,
      movement: movementRecord,
      new_stock: updatedVariant.stock_quantity,
      toastMessage,
    };
  }

  /**
   * Retrieves historical movements with hydrated product details, signed quantities, and filtering.
   */
  async listMovements(options?: {
    type?: string;
    search?: string;
  }): Promise<StockMovementDisplayItem[]> {
    let rawMovements: StockMovementDTO[] = [];

    if (this.supabase) {
      try {
        let query = this.supabase
          .from('stock_movements')
          .select('id, variant_id, movement_type, quantity, reason, note, created_at')
          .order('created_at', { ascending: false });

        if (options?.type === 'In') {
          query = query.eq('movement_type', 'In');
        } else if (options?.type === 'Out') {
          query = query.in('movement_type', ['Out', 'Sale']);
        }

        const { data, error } = await query;
        if (!error && data) {
          rawMovements = data as SupabaseMovementRow[];
        } else {
          rawMovements = [...inMemoryMovements];
        }
      } catch {
        rawMovements = [...inMemoryMovements];
      }
    } else {
      rawMovements = [...inMemoryMovements];
    }

    // Hydrate variant details
    const products = await this.productService.getProducts();
    const variantMap = new Map<
      string,
      { productName: string; size: string; sizeLabel: string }
    >();

    for (const p of products) {
      for (const v of p.variants) {
        variantMap.set(v.id, {
          productName: p.name,
          size: v.size,
          sizeLabel: getSizeLabel(v.size),
        });
      }
    }

    let items: StockMovementDisplayItem[] = rawMovements.map((m) => {
      const vInfo = variantMap.get(m.variant_id) ?? {
        productName: 'Product',
        size: '',
        sizeLabel: '',
      };
      const variantLabel = formatMovementVariantLabel(vInfo.productName, vInfo.sizeLabel);
      const displayNote = m.note.startsWith('Sale')
        ? m.note
        : formatMovementDisplayNote(m.reason, m.note);

      return {
        ...m,
        product_name: vInfo.productName,
        size: vInfo.size,
        variant_label: variantLabel,
        display_note: displayNote,
        signed_quantity: formatSignedQuantity(m.movement_type, m.quantity),
      };
    });

    // Sort newest first
    items.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Filter by type if not already filtered
    if (options?.type === 'In') {
      items = items.filter((m) => m.movement_type === 'In');
    } else if (options?.type === 'Out') {
      items = items.filter((m) => m.movement_type === 'Out' || m.movement_type === 'Sale');
    }

    // Real-time search filter
    if (options?.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      items = items.filter((m) => {
        return (
          m.product_name.toLowerCase().includes(q) ||
          m.variant_label.toLowerCase().includes(q) ||
          m.display_note.toLowerCase().includes(q) ||
          m.reason.toLowerCase().includes(q) ||
          m.note.toLowerCase().includes(q)
        );
      });
    }

    return items;
  }

  /**
   * Retrieves selectable variants with current live stock for the Stock In/Out forms.
   */
  async listVariantsForStock(): Promise<VariantStockOption[]> {
    const products = await this.productService.getProducts();
    const options: VariantStockOption[] = [];

    for (const p of products) {
      for (const v of p.variants) {
        const sizeLabel = getSizeLabel(v.size);
        const variantLabel = formatMovementVariantLabel(p.name, sizeLabel);
        options.push({
          id: v.id,
          product_name: p.name,
          size: v.size,
          size_label: sizeLabel,
          variant_label: variantLabel,
          stock_quantity: v.stock_quantity,
          selector_label: `${variantLabel} (${v.stock_quantity} in stock)`,
        });
      }
    }

    return options;
  }

  /**
   * Retrieves the 5 most recent movements for a specific direction (excluding sales).
   */
  async getRecentMovements(
    type: 'In' | 'Out',
    limit = 5
  ): Promise<StockMovementDisplayItem[]> {
    const all = await this.listMovements({ type });
    return all
      .filter((m) => !m.note.startsWith('Sale') && m.reason !== 'Sale')
      .slice(0, limit);
  }
}
