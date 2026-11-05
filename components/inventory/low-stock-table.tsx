'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import type { InventoryVariant } from '@/lib/inventory/types';
import { useInventoryRealtime } from '@/lib/hooks/use-inventory-realtime';
import { InventoryTabs } from './inventory-tabs';

interface LowStockTableProps {
  initialVariants: InventoryVariant[];
}

export function LowStockTable({ initialVariants }: Readonly<LowStockTableProps>) {
  const { variants } = useInventoryRealtime(initialVariants);

  const lowVariants = useMemo(() => {
    return variants.filter((v) => v.stockQuantity <= v.minStockLevel);
  }, [variants]);

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-tight m-0">
          Low stock alerts
        </h1>
        <p className="text-[14.5px] text-text-muted mt-1 m-0">
          Variants at or below the minimum level.
        </p>
      </div>

      {/* Sub-Navigation Tabs */}
      <InventoryTabs activeTab="low" />

      {/* Main Table Card */}
      <div className="card bg-bg-surface border border-border rounded-[var(--r)] shadow-xs overflow-hidden">
        <div className="tbl-wrap overflow-x-auto">
          {lowVariants.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success-light text-success mb-3">
                <svg
                  className="w-6 h-6 stroke-current"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2 className="text-[17px] font-bold text-text-primary m-0">
                Nothing is low
              </h2>
              <p className="text-[14px] text-text-muted mt-1 m-0">
                Every variant is above its minimum level.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-bg-base/50 text-[12.5px] uppercase tracking-wider font-semibold text-text-muted">
                  <th scope="col" className="px-4 py-3" style={{ width: '28%' }}>
                    Product
                  </th>
                  <th scope="col" className="px-4 py-3" style={{ width: '18%' }}>
                    Size
                  </th>
                  <th scope="col" className="px-4 py-3 text-right" style={{ width: '16%' }}>
                    In stock
                  </th>
                  <th scope="col" className="px-4 py-3 text-right" style={{ width: '16%' }}>
                    Minimum
                  </th>
                  <th scope="col" className="px-4 py-3 text-right" style={{ width: '16%' }}>
                    Short by
                  </th>
                  <th scope="col" className="px-4 py-3 text-right" style={{ width: '120px' }}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {lowVariants.map((v) => {
                  const shortBy = Math.max(0, v.minStockLevel - v.stockQuantity);

                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-bg-hover transition-colors"
                    >
                      <td className="px-4 py-3.5 text-text-primary font-bold text-[15px]">
                        {v.productName}
                      </td>
                      <td className="px-4 py-3.5 text-text-secondary text-[14.5px]">
                        {v.sizeLabel}
                      </td>
                      <td className="num px-4 py-3.5 text-right font-bold text-[15px] text-danger">
                        {v.stockQuantity}
                      </td>
                      <td className="num px-4 py-3.5 text-right text-[14.5px] text-text-secondary">
                        {v.minStockLevel}
                      </td>
                      <td className="num px-4 py-3.5 text-right font-bold text-[15px] text-text-primary">
                        {shortBy}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <Link
                          href={`/inventory/in?v=${v.id}`}
                          className="btn sm inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-[var(--r)] bg-primary hover:bg-primary-hover text-text-light transition-colors"
                        >
                          Stock in
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Footer Guidance Note */}
      <p className="text-text-muted text-[13.5px] mt-3">
        Change thresholds under{' '}
        <Link
          href="/settings/stock"
          className="text-primary hover:underline font-medium"
        >
          Settings, Minimum stock levels
        </Link>
        .
      </p>
    </div>
  );
}
