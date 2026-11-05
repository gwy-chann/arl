'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../supabase/client';
import type { InventoryVariant } from '../inventory/types';

interface RealtimeVariantRow {
  id: string;
  product_id: string;
  size: string;
  cost_price: number | string;
  selling_price: number | string;
  stock_quantity: number;
  min_stock_level: number;
  updated_at: string;
}

export function useInventoryRealtime(initialVariants: InventoryVariant[]) {
  const [variants, setVariants] = useState<InventoryVariant[]>(initialVariants);

  // Keep state synced when initialVariants prop changes
  useEffect(() => {
    setVariants(initialVariants);
  }, [initialVariants]);

  // Handle single variant update
  const handleVariantUpdate = useCallback((updatedRow: RealtimeVariantRow) => {
    setVariants((prev) =>
      prev.map((item) => {
        if (item.id === updatedRow.id) {
          return {
            ...item,
            stockQuantity: Number(updatedRow.stock_quantity ?? item.stockQuantity),
            minStockLevel: Number(updatedRow.min_stock_level ?? item.minStockLevel),
            costPrice: updatedRow.cost_price !== undefined ? Number(updatedRow.cost_price) : item.costPrice,
            sellingPrice: updatedRow.selling_price !== undefined ? Number(updatedRow.selling_price) : item.sellingPrice,
            updatedAt: updatedRow.updated_at || new Date().toISOString(),
          };
        }
        return item;
      })
    );
  }, []);

  // Direct programmatic updater (useful for testing or local mutations)
  const updateLocalStock = useCallback((variantId: string, newStock: number) => {
    setVariants((prev) =>
      prev.map((item) =>
        item.id === variantId
          ? {
              ...item,
              stockQuantity: Math.max(0, Math.floor(newStock)),
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
  }, []);

  useEffect(() => {
    let supabase: ReturnType<typeof createClient> | null = null;
    try {
      supabase = createClient();
    } catch {
      // In offline or non-browser environments, skip realtime connection
      return;
    }

    if (!supabase) return;

    const channel = supabase
      .channel('realtime:product_variants')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'product_variants',
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            handleVariantUpdate(payload.new as RealtimeVariantRow);
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [handleVariantUpdate]);

  return {
    variants,
    setVariants,
    updateLocalStock,
  };
}
