'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '../supabase/client';
import { getInventoryVariantsAction } from '../inventory/inventory-actions';
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
  const [prevInitialVariants, setPrevInitialVariants] = useState(initialVariants);

  // Synchronize state during render if parent initialVariants changes
  if (initialVariants !== prevInitialVariants) {
    setPrevInitialVariants(initialVariants);
    setVariants(initialVariants);
  }

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

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const refreshInventory = useCallback(async () => {
    try {
      const fresh = await getInventoryVariantsAction();
      if (Array.isArray(fresh)) {
        setVariants(fresh);
      }
    } catch {
      // ignore
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      void refreshInventory();
    }, 60);
  }, [refreshInventory]);

  useEffect(() => {
    let broadcastChannel: BroadcastChannel | null = null;
    const handleLocalUpdate = () => {
      scheduleRefresh();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('arl:products-updated', handleLocalUpdate);

      if (typeof BroadcastChannel !== 'undefined') {
        try {
          broadcastChannel = new BroadcastChannel('arl-products-channel');
          broadcastChannel.onmessage = (event) => {
            if (event.data?.type === 'PRODUCTS_UPDATED') {
              scheduleRefresh();
            }
          };
        } catch {
          // ignore
        }
      }
    }

    let supabase: ReturnType<typeof createClient> | null = null;
    try {
      supabase = createClient();
    } catch {
      // In offline or non-browser environments, skip realtime connection
    }

    if (!supabase) {
      return () => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        if (typeof window !== 'undefined') {
          window.removeEventListener('arl:products-updated', handleLocalUpdate);
        }
        broadcastChannel?.close();
      };
    }

    const channel = supabase
      .channel('realtime:inventory_catalog')
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
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'product_variants',
        },
        () => {
          scheduleRefresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'product_variants',
        },
        () => {
          scheduleRefresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        () => {
          scheduleRefresh();
        }
      )
      .subscribe();

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (typeof window !== 'undefined') {
        window.removeEventListener('arl:products-updated', handleLocalUpdate);
      }
      broadcastChannel?.close();
      supabase?.removeChannel(channel);
    };
  }, [handleVariantUpdate, scheduleRefresh]);

  return {
    variants,
    setVariants,
    updateLocalStock,
  };
}
