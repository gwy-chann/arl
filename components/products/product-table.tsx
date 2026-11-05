'use client';

import React, { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import type { ProductWithVariants } from '@/specs/006-multi-variant-product-catalog/contracts/product-contracts';
import {
  getSizeLabel,
  formatPeso,
  getDeleteProductPrompt,
} from '@/specs/006-multi-variant-product-catalog/contracts/product-contracts';
import { useConfirm } from '@/components/ui/confirm-provider';
import { useToast } from '@/components/ui/toast-provider';
import { deleteProductAction } from '@/lib/products/product-actions';

interface ProductTableProps {
  initialProducts: ProductWithVariants[];
}

export function ProductTable({ initialProducts }: Readonly<ProductTableProps>) {
  const [products, setProducts] = useState<ProductWithVariants[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const confirm = useConfirm();
  const { showToast } = useToast();
  const [, startTransition] = useTransition();

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;

    return products.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q);
      const matchCat = (p.category_name || '').toLowerCase().includes(q);
      const matchSize = p.variants.some((v) =>
        getSizeLabel(v.size).toLowerCase().includes(q)
      );
      return matchName || matchCat || matchSize;
    });
  }, [products, searchQuery]);

  const handleDeleteProduct = async (product: ProductWithVariants) => {
    const prompt = getDeleteProductPrompt(product.name);
    const confirmed = await confirm({
      title: prompt.title,
      message: prompt.message,
      confirmLabel: prompt.confirmLabel,
      variant: prompt.variant,
    });

    if (!confirmed) {
      return;
    }

    const result = await deleteProductAction(product.id);
    if (!result.success) {
      showToast(result.error || 'Failed to delete product', undefined, 'danger');
      return;
    }

    startTransition(() => {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    });
    showToast('Product deleted');
  };

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-tight m-0">
            Products
          </h1>
          <p className="text-[14.5px] text-text-muted mt-1 m-0">
            Three products, three sizes each: nine sellable items.
          </p>
        </div>
        <div>
          <Link
            href="/products/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--r)] bg-primary hover:bg-primary-hover text-text-light font-medium text-[14px] shadow-xs transition-colors"
          >
            <svg
              className="w-4 h-4 stroke-current"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add product
          </Link>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-bg-surface border border-border rounded-[var(--r)] shadow-xs overflow-hidden">
        {/* Toolbar with Search Box */}
        <div className="p-3 bg-bg-base border-b border-border flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products or sizes"
              className="w-full bg-bg-surface border border-border rounded-[var(--r)] pl-3 pr-8 py-1.5 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors"
              aria-label="Search products or sizes"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-[14px] leading-none"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Responsive Table Wrap */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="ptbl">
            <thead>
              <tr className="border-b border-border bg-bg-base/50 text-[12.5px] uppercase tracking-wider font-semibold text-text-muted">
                <th scope="col" className="px-4 py-3" style={{ width: '24%' }}>
                  Product
                </th>
                <th scope="col" className="px-4 py-3" style={{ width: '13%' }}>
                  Size
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right"
                  style={{ width: '11%' }}
                >
                  Cost
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right"
                  style={{ width: '13%' }}
                >
                  Selling price
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right"
                  style={{ width: '11%' }}
                >
                  Profit each
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right"
                  style={{ width: '10%' }}
                >
                  In stock
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right"
                  style={{ width: '10%' }}
                >
                  Minimum
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right"
                  style={{ width: '150px' }}
                >
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-text-muted text-[14.5px]"
                  >
                    No products found matching your search.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const variantCount = p.variants.length || 1;
                  return p.variants.map((v, i) => (
                    <tr
                      key={v.id || `${p.id}-${v.size}`}
                      className="hover:bg-bg-hover/50 transition-colors"
                      data-product={p.name}
                    >
                      {/* Product Name & Category spanning all variants */}
                      {i === 0 && (
                        <td
                          rowSpan={variantCount}
                          className="px-4 py-3.5 align-middle border-r border-border bg-bg-surface"
                        >
                          <b className="text-[15.5px] font-bold text-text-primary block leading-tight">
                            {p.name}
                          </b>
                          <span className="text-[13px] text-text-muted block mt-0.5">
                            {p.category_name || 'Uncategorized'}
                          </span>
                        </td>
                      )}

                      {/* Variant Details */}
                      <td className="px-4 py-3.5 text-[14px] font-medium text-text-primary">
                        {getSizeLabel(v.size)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-[14px] tabular-nums text-text-primary font-mono">
                        {formatPeso(v.cost_price)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-[14px] tabular-nums text-text-primary font-mono">
                        {formatPeso(v.selling_price)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-[14px] tabular-nums text-text-primary font-mono font-medium">
                        {formatPeso(v.unit_profit)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-[14px] tabular-nums text-text-primary font-mono">
                        {v.stock_quantity}
                      </td>
                      <td className="px-4 py-3.5 text-right text-[14px] tabular-nums text-text-secondary font-mono">
                        {v.min_stock_level}
                      </td>

                      {/* Action buttons spanning all variants */}
                      {i === 0 && (
                        <td
                          rowSpan={variantCount}
                          className="px-4 py-3.5 align-middle text-right whitespace-nowrap bg-bg-surface"
                          style={{ width: '150px' }}
                        >
                          <div className="inline-flex items-center gap-1.5">
                            <Link
                              href={`/products/${p.id}/edit`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[13px] font-medium rounded-[var(--r)] bg-secondary hover:bg-secondary-hover text-text-primary border border-border transition-colors"
                            >
                              <svg
                                className="w-3.5 h-3.5 stroke-current"
                                viewBox="0 0 24 24"
                                fill="none"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                              </svg>
                              Edit
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[13px] font-medium rounded-[var(--r)] bg-danger/10 hover:bg-danger/20 text-danger border border-danger-border/30 transition-colors cursor-pointer"
                            >
                              <svg
                                className="w-3.5 h-3.5 stroke-current"
                                viewBox="0 0 24 24"
                                fill="none"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ));
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
