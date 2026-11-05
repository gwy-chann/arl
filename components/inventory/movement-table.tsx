'use client';

import React, { useState, useMemo } from 'react';
import { InventoryTabs } from './inventory-tabs';
import type { StockMovementDisplayItem } from '@/lib/inventory/stock-contracts';

interface MovementTableProps {
  initialMovements: StockMovementDisplayItem[];
}

export function MovementTable({ initialMovements }: Readonly<MovementTableProps>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'In' | 'Out'>('All');

  const filteredMovements = useMemo(() => {
    let list = initialMovements;

    // Filter by movement type
    if (typeFilter === 'In') {
      list = list.filter((m) => m.movement_type === 'In');
    } else if (typeFilter === 'Out') {
      list = list.filter((m) => m.movement_type === 'Out' || m.movement_type === 'Sale');
    }

    // Filter by search text
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((m) => {
        return (
          m.product_name.toLowerCase().includes(q) ||
          m.variant_label.toLowerCase().includes(q) ||
          m.display_note.toLowerCase().includes(q) ||
          m.reason.toLowerCase().includes(q) ||
          m.note.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [initialMovements, typeFilter, searchQuery]);

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-tight m-0">
          Stock movement history
        </h1>
        <p className="text-[14.5px] text-text-muted mt-1 m-0">
          Every stock in, stock out and sale deduction.
        </p>
      </div>

      {/* Persistent Navigation Tabs */}
      <InventoryTabs activeTab="history" />

      {/* Main Table Card */}
      <div className="bg-bg-surface border border-border rounded-[var(--r)] shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-3.5 sm:p-4 border-b border-border bg-bg-surface flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
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
              placeholder="Search product or note"
              aria-label="Search product or note"
              className="w-full pl-9 pr-3.5 py-1.5 text-[14px] rounded-[var(--r)] bg-bg-input border border-border text-text-primary placeholder:text-text-muted focus:outline-hidden focus:border-border-focus"
            />
          </div>

          {/* Type Filter Dropdown */}
          <div className="shrink-0">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'All' | 'In' | 'Out')}
              aria-label="Type"
              className="px-3.5 py-1.5 text-[14px] rounded-[var(--r)] bg-bg-input border border-border text-text-primary focus:outline-hidden focus:border-border-focus"
            >
              <option value="All">All movements</option>
              <option value="In">In</option>
              <option value="Out">Out</option>
            </select>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px] border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg-muted/30 text-text-muted font-medium text-[13px]">
                <th className="py-2.5 px-4 font-semibold">Date</th>
                <th className="py-2.5 px-4 font-semibold">Product</th>
                <th className="py-2.5 px-4 font-semibold">Type</th>
                <th className="py-2.5 px-4 font-semibold text-right">Qty</th>
                <th className="py-2.5 px-4 font-semibold">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-text-muted text-[14.5px]">
                    No stock movements found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const isIn = m.movement_type === 'In';
                  const isSale = m.note.startsWith('Sale') || m.movement_type === 'Sale';

                  let badgeLabel = 'Stock out';
                  let badgeClass = 'bg-accent-light text-accent border border-accent-border';

                  if (isIn) {
                    badgeLabel = 'Stock in';
                    badgeClass = 'bg-success-light text-success border border-success-border';
                  } else if (isSale) {
                    badgeLabel = 'Sale';
                    badgeClass = 'bg-info-light text-info border border-info-border';
                  }

                  const formattedDate = new Date(m.created_at).toLocaleDateString('en-PH', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  });

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-bg-hover transition-colors"
                      data-s={`${m.variant_label} ${m.display_note}`}
                      data-t={m.movement_type}
                    >
                      <td
                        data-label="Date"
                        className="py-3 px-4 text-text-muted whitespace-nowrap text-[13.5px]"
                      >
                        {formattedDate}
                      </td>
                      <td data-label="Product" className="py-3 px-4">
                        <b className="text-text-primary font-semibold">{m.variant_label}</b>
                      </td>
                      <td data-label="Type" className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}
                        >
                          {badgeLabel}
                        </span>
                      </td>
                      <td
                        data-label="Quantity"
                        className="py-3 px-4 text-right whitespace-nowrap font-bold"
                      >
                        <span className={isIn ? 'text-success' : 'text-accent'}>
                          {m.signed_quantity}
                        </span>
                      </td>
                      <td data-label="Note" className="py-3 px-4 text-text-muted text-[13.5px]">
                        {m.display_note}
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
