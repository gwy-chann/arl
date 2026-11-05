'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import type { InventoryVariant } from '@/lib/inventory/types';
import { computeCapacityMeter } from '@/lib/inventory/capacity-meter';
import { useInventoryRealtime } from '@/lib/hooks/use-inventory-realtime';
import { CapacityMeter } from './capacity-meter';
import { StockStatusPill } from './stock-status-pill';
import { InventoryTabs } from './inventory-tabs';

interface InventoryTableProps {
  initialVariants: InventoryVariant[];
}

export function InventoryTable({ initialVariants }: Readonly<InventoryTableProps>) {
  const { variants } = useInventoryRealtime(initialVariants);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVariants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return variants;

    return variants.filter((v) => {
      const matchProduct = v.productName.toLowerCase().includes(q);
      const matchSize = v.sizeLabel.toLowerCase().includes(q) || v.size.toLowerCase().includes(q);
      const matchCategory = (v.categoryName || '').toLowerCase().includes(q);
      return matchProduct || matchSize || matchCategory;
    });
  }, [variants, searchQuery]);

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-tight m-0">
          Inventory
        </h1>
        <p className="text-[14.5px] text-text-muted mt-1 m-0">
          Live stock for all nine variants. Sales deduct stock automatically.
        </p>
      </div>

      {/* Sub-Navigation Tabs */}
      <InventoryTabs activeTab="inventory" />

      {/* Main Table Card */}
      <div className="card bg-bg-surface border border-border rounded-[var(--r)] shadow-xs overflow-hidden">
        {/* Search Toolbar */}
        <div className="toolbar p-3 bg-bg-base border-b border-border flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product or size"
              className="w-full bg-bg-surface border border-border rounded-[var(--r)] pl-3 pr-8 py-1.5 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-focus transition-colors"
              aria-label="Search product or size"
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

        {/* Responsive Table */}
        <div className="tbl-wrap overflow-x-auto">
          <table id="itbl" className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg-base/50 text-[12.5px] uppercase tracking-wider font-semibold text-text-muted">
                <th scope="col" className="px-4 py-3" style={{ width: '22%' }}>
                  Product
                </th>
                <th scope="col" className="px-4 py-3" style={{ width: '14%' }}>
                  Size
                </th>
                <th scope="col" className="px-4 py-3 text-right" style={{ width: '12%' }}>
                  In stock
                </th>
                <th scope="col" className="px-4 py-3 text-right" style={{ width: '12%' }}>
                  Minimum
                </th>
                <th scope="col" className="px-4 py-3" style={{ width: '20%' }}>
                  Level
                </th>
                <th scope="col" className="px-4 py-3" style={{ width: '14%' }}>
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-right" style={{ width: '180px' }}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredVariants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-text-muted text-[14.5px]">
                    No variants match &quot;{searchQuery}&quot;
                  </td>
                </tr>
              ) : (
                filteredVariants.map((v) => {
                  const evalResult = computeCapacityMeter(v.stockQuantity, v.minStockLevel);

                  return (
                    <tr
                      key={v.id}
                      data-s={`${v.productName} ${v.sizeLabel}`}
                      className="hover:bg-bg-hover transition-colors"
                    >
                      <td className="px-4 py-3.5 text-text-primary font-bold text-[15px]">
                        {v.productName}
                      </td>
                      <td className="px-4 py-3.5 text-text-secondary text-[14.5px]">
                        {v.sizeLabel}
                      </td>
                      <td className="num px-4 py-3.5 text-right font-bold text-[15px] text-text-primary">
                        {v.stockQuantity}
                      </td>
                      <td className="num px-4 py-3.5 text-right text-[14.5px] text-text-secondary">
                        {v.minStockLevel}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <CapacityMeter
                            percentage={evalResult.percentage}
                            isLow={evalResult.isLow}
                            ariaLabel={`${v.productName} ${v.sizeLabel} capacity`}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <StockStatusPill
                          status={evalResult.status}
                          label={evalResult.statusLabel}
                          variant={evalResult.statusVariant}
                        />
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            href={`/inventory/in?v=${v.id}`}
                            className="btn sec sm inline-flex items-center justify-center px-2.5 py-1 text-xs font-semibold rounded-[var(--r)] bg-secondary hover:bg-secondary-hover text-text-primary border border-border transition-colors"
                          >
                            Stock in
                          </Link>
                          <Link
                            href={`/inventory/out?v=${v.id}`}
                            className="btn sec sm inline-flex items-center justify-center px-2.5 py-1 text-xs font-semibold rounded-[var(--r)] bg-secondary hover:bg-secondary-hover text-text-primary border border-border transition-colors"
                          >
                            Stock out
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
