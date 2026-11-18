'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '../supabase/client';
import { getProductsAction } from '../products/product-actions';
import type { ProductWithVariants } from '@/specs/006-multi-variant-product-catalog/contracts/product-contracts';

export interface UseProductsRealtimeResult {
  products: ProductWithVariants[];
  setProducts: React.Dispatch<React.SetStateAction<ProductWithVariants[]>>;
  refreshProducts: () => Promise<void>;
  isConnected: boolean;
}

export function useProductsRealtime(
  initialProducts: ProductWithVariants[]
): UseProductsRealtimeResult {
  const [products, setProducts] = useState<ProductWithVariants[]>(initialProducts);
  const [prevInitialProducts, setPrevInitialProducts] = useState(initialProducts);
  const [isConnected, setIsConnected] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize state during render if parent initialProducts changes
  if (initialProducts !== prevInitialProducts) {
    setPrevInitialProducts(initialProducts);
    setProducts(initialProducts);
  }

  // Refetch latest products from server action (with joined categories, profit calculation, sorting)
  const refreshProducts = useCallback(async () => {
    try {
      const fresh = await getProductsAction();
      if (Array.isArray(fresh)) {
        setProducts(fresh);
      }
    } catch (err) {
      console.warn('[useProductsRealtime] Failed to refresh products:', err);
    }
  }, []);

  // Debounced refresh handler to avoid multiple rapid queries during batch mutations
  const scheduleRefresh = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      void refreshProducts();
    }, 60);
  }, [refreshProducts]);

  useEffect(() => {
    // 1. Cross-tab & local in-browser messaging (BroadcastChannel & CustomEvent)
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
          // BroadcastChannel may not be supported or restricted in some environments
        }
      }
    }

    // 2. Supabase Realtime subscription
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
      .channel('realtime:products_catalog')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          scheduleRefresh();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_variants' },
        () => {
          scheduleRefresh();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => {
          scheduleRefresh();
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (typeof window !== 'undefined') {
        window.removeEventListener('arl:products-updated', handleLocalUpdate);
      }
      broadcastChannel?.close();
      supabase?.removeChannel(channel);
    };
  }, [scheduleRefresh]);

  return {
    products,
    setProducts,
    refreshProducts,
    isConnected,
  };
}
