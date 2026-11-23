/**
 * Helper to dispatch cross-tab and in-window notifications when products or variants mutate.
 */
export function notifyProductsUpdated(): void {
  if (typeof window !== 'undefined') {
    try {
      const bc = new BroadcastChannel('arl-products-channel');
      bc.postMessage({ type: 'PRODUCTS_UPDATED' });
      bc.close();
    } catch {
      // BroadcastChannel might not be supported in some environments
    }

    try {
      window.dispatchEvent(new CustomEvent('arl:products-updated'));
    } catch {
      // Ignore if CustomEvent is restricted
    }
  }
}
