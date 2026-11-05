'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { InventoryTabs } from './inventory-tabs.ts';
import type { VariantStockOption } from '@/lib/inventory/stock-service';

export interface OverviewVariantItem extends VariantStockOption {
  min_stock_level: number;
}

interface InventoryOverviewTableProps {
  initialVariants: OverviewVariantItem[];
}

export function InventoryOverviewTable({
  initialVariants,
}: Readonly<InventoryOverviewTableProps>) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVariants = useMemo(() => {
    if (!searchQuery.trim()) return initialVariants;
    const q = searchQuery.trim().toLowerCase();
    return initialVariants.filter(
      (v) =>
        v.product_name.toLowerCase().includes(q) ||
        v.size_label.toLowerCase().includes(q)
    );
  }, [initialVariants, searchQuery]);

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-tight m-0">
          Inventory
        </h1>
        <p className="text-[14.5px] text-text-muted mt-1 m-0">
          Live stock for all nine variants. Sales deduct stock automatically.
        </p>
      </div>

      {/* Persistent Navigation Tabs */}
      <InventoryTabs activeTab="inventory" />

      {/* Main Table Card */}
      <div className="bg-bg-surface border border-border rounded-[var(--r)] shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-3.5 sm:p-4 border-b border-border bg-bg-surface flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product or size"
              aria-label="Search product or size"
              className="w-full pl-9 pr-3.5 py-1.5 text-[14px] rounded-[var(--r)] bg-bg-input border border-border text-text-primary placeholder:text-text-muted focus:outline-hidden focus:border-border-focus"
            />
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px] border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg-muted/30 text-text-muted font-medium text-[13px]">
                <th className="py-2.5 px-4 font-semibold">Product</th>
                <th className="py-2.5 px-4 font-semibold">Size</th>
                <th className="py-2.5 px-4 font-semibold text-right">In stock</th>
                <th className="py-2.5 px-4 font-semibold text-right">Minimum</th>
                <th className="py-2.5 px-4 font-semibold w-1/5">Level</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredVariants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-muted text-[14.5px]">
                    No variants found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredVariants.map((v) => {
                  const isLow = v.stock_quantity <= v.min_stock_level;
                  const isOut = v.stock_quantity === 0;
                  const isGettingLow = !isLow && v.stock_quantity <= v.min_stock_level * 1.4;

                  let statusText = 'In stock';
                  let statusClass = 'bg-success-light text-success border border-success-border';

                  if (isOut) {
                    statusText = 'Out of stock';
                    statusClass = 'bg-danger-light text-danger border border-danger-border';
                  } else if (isLow) {
                    statusText = 'Low stock';
                    statusClass = 'bg-accent-light text-accent border border-accent-border';
                  } else if (isGettingLow) {
                    statusText = 'Getting low';
                    statusClass = 'bg-accent-light text-accent border border-accent-border';
                  }

                  const meterMax = Math.max(v.min_stock_level * 2.5, 1);
                  const meterPct = Math.min(Math.round((v.stock_quantity / meterMax) * 100), 100);

                  return (
                    <tr key={v.id} className="hover:bg-bg-hover transition-colors">
                      <td data-label="Product" className="py-3 px-4">
                        <b className="text-text-primary font-semibold">{v.product_name}</b>
                      </td>
                      <td data-label="Size" className="py-3 px-4 text-text-primary">
                        {v.size_label}
                      </td>
                      <td
                        data-label="In stock"
                        className={`py-3 px-4 text-right font-bold ${
                          isLow || isOut ? 'text-danger' : 'text-text-primary'
                        }`}
                      >
                        {v.stock_quantity}
                      </td>
                      <td
                        data-label="Minimum"
                        className="py-3 px-4 text-right text-text-muted"
                      >
                        {v.min_stock_level}
                      </td>
                      <td data-label="Level" className="py-3 px-4">
                        <div className="w-full bg-bg-muted rounded-full h-2 overflow-hidden border border-border">
                          <div
                            className={`h-full rounded-full ${
                              isLow || isOut ? 'bg-danger' : 'bg-primary'
                            }`}
                            style={{ width: `${meterPct}%` }}
                          />
                        </div>
                      </td>
                      <td data-label="Status" className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusClass}`}
                        >
                          {statusText}
                        </span>
                      </td>
                      <td data-label="Actions" className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            href={`/inventory/in?v=${v.id}`}
                            className="px-2.5 py-1 text-xs font-medium rounded-[var(--r)] bg-secondary hover:bg-secondary-hover text-text-primary border border-border transition-colors"
                          >
                            Stock in
                          </Link>
                          <Link
                            href={`/inventory/out?v=${v.id}`}
                            className="px-2.5 py-1 text-xs font-medium rounded-[var(--r)] bg-secondary hover:bg-secondary-hover text-text-primary border border-border transition-colors"
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
