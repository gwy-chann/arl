'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { InventoryTabs } from './inventory-tabs.ts';
import { useToast } from '@/components/ui/toast-provider';
import {
  STOCK_IN_REASONS,
  STOCK_OUT_REASONS,
  formatInsufficientStockToast,
  type StockMovementDisplayItem,
} from '@/lib/inventory/stock-contracts';
import { recordStockMovementAction } from '@/lib/inventory/stock-actions';
import type { VariantStockOption } from '@/lib/inventory/stock-service';

interface StockFormProps {
  kind: 'in' | 'out';
  variants: VariantStockOption[];
  initialVariantId?: string;
  recentMovements: StockMovementDisplayItem[];
}

export function StockForm({
  kind,
  variants,
  initialVariantId,
  recentMovements,
}: Readonly<StockFormProps>) {
  const isIn = kind === 'in';
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const defaultVariantId =
    initialVariantId && variants.some((v) => v.id === initialVariantId)
      ? initialVariantId
      : variants[0]?.id || '';

  const reasons = isIn ? STOCK_IN_REASONS : STOCK_OUT_REASONS;

  const [selectedVariantId, setSelectedVariantId] = useState<string>(defaultVariantId);
  const [quantity, setQuantity] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<string>(reasons[0]);
  const [note, setNote] = useState<string>('');

  const todayFormatted = new Date().toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      showToast('Please enter a valid quantity of at least 1');
      return;
    }

    if (!selectedVariant) {
      showToast('Please select a product variant');
      return;
    }

    // Invariant Safeguard (Scenario 3): Prevent stock out exceeding available stock
    if (!isIn && qty > selectedVariant.stock_quantity) {
      showToast(formatInsufficientStockToast(selectedVariant.stock_quantity));
      return;
    }

    startTransition(async () => {
      const res = await recordStockMovementAction({
        variant_id: selectedVariantId,
        movement_type: isIn ? 'In' : 'Out',
        quantity: qty,
        reason: selectedReason,
        note: note.trim(),
      });

      if (!res.success) {
        showToast(res.error || 'Failed to save stock movement');
        return;
      }

      showToast(res.toastMessage || `${isIn ? 'Stock in' : 'Stock out'} saved`);
      router.push('/inventory');
    });
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-tight m-0">
          {isIn ? 'Stock in' : 'Stock out'}
        </h1>
        <p className="text-[14.5px] text-text-muted mt-1 m-0">
          {isIn ? 'Record stock that arrived.' : 'Record stock that left without a sale.'}
        </p>
      </div>

      {/* Persistent Navigation Tabs */}
      <InventoryTabs activeTab={kind} />

      {/* 2-Column Split Layout matching mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_350px] gap-5 items-start">
        {/* Left Column: Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-bg-surface border border-border rounded-[var(--r)] shadow-xs overflow-hidden"
        >
          <div className="p-5 sm:p-6 space-y-4">
            {/* Product and Size */}
            <div>
              <label
                htmlFor="sv"
                className="block text-[14px] font-medium text-text-primary mb-1.5"
              >
                Product and size
              </label>
              <select
                id="sv"
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[var(--r)] bg-bg-input border border-border text-text-primary text-[14.5px] focus:outline-hidden focus:border-border-focus"
                required
              >
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.product_name} - {v.size_label} ({v.stock_quantity} in stock)
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity and Date Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="sq"
                  className="block text-[14px] font-medium text-text-primary mb-1.5"
                >
                  Quantity
                </label>
                <input
                  id="sq"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  required
                  className="w-full px-3.5 py-2.5 rounded-[var(--r)] bg-bg-input border border-border text-text-primary text-[14.5px] focus:outline-hidden focus:border-border-focus"
                />
              </div>

              <div>
                <label
                  htmlFor="sd"
                  className="block text-[14px] font-medium text-text-primary mb-1.5"
                >
                  Date
                </label>
                <input
                  id="sd"
                  type="text"
                  value={todayFormatted}
                  readOnly
                  className="w-full px-3.5 py-2.5 rounded-[var(--r)] bg-bg-muted border border-border text-text-muted text-[14.5px] cursor-not-allowed"
                />
              </div>
            </div>

            {/* Source / Reason */}
            <div>
              <label
                htmlFor="sr"
                className="block text-[14px] font-medium text-text-primary mb-1.5"
              >
                {isIn ? 'Source' : 'Reason'}
              </label>
              <select
                id="sr"
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[var(--r)] bg-bg-input border border-border text-text-primary text-[14.5px] focus:outline-hidden focus:border-border-focus"
              >
                {reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Note (optional) */}
            <div>
              <label
                htmlFor="sn"
                className="block text-[14px] font-medium text-text-primary mb-1.5"
              >
                Note <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <input
                id="sn"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Delivery receipt no."
                className="w-full px-3.5 py-2.5 rounded-[var(--r)] bg-bg-input border border-border text-text-primary text-[14.5px] focus:outline-hidden focus:border-border-focus"
              />
            </div>
          </div>

          {/* Form Footer */}
          <div className="flex items-center justify-end gap-3 px-5 py-4 bg-bg-muted/40 border-t border-border">
            <Link
              href="/inventory"
              className="px-4 py-2 rounded-[var(--r)] bg-secondary hover:bg-secondary-hover text-text-primary text-[14px] font-medium border border-border transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-[var(--r)] bg-primary hover:bg-primary-hover text-text-light text-[14px] font-medium shadow-xs transition-colors disabled:opacity-50"
            >
              {isPending
                ? 'Saving...'
                : isIn
                ? 'Save stock in'
                : 'Save stock out'}
            </button>
          </div>
        </form>

        {/* Right Column: Recent Activity Card */}
        <div className="bg-bg-surface border border-border rounded-[var(--r)] shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-[16px] font-bold text-text-primary m-0">
              Recent {isIn ? 'stock in' : 'stock out'}
            </h3>
          </div>
          <div className="divide-y divide-border">
            {recentMovements.length === 0 ? (
              <div className="p-6 text-center text-text-muted text-[14px]">
                No recent {isIn ? 'stock in' : 'stock out'} records.
              </div>
            ) : (
              recentMovements.map((m) => (
                <div
                  key={m.id}
                  className="p-4 flex items-center justify-between gap-3 text-[14.5px]"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-text-primary truncate">
                      {m.variant_label}
                    </div>
                    <small className="block text-text-muted text-[13px] truncate mt-0.5">
                      {new Date(m.created_at).toLocaleDateString('en-PH', {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      · {m.display_note}
                    </small>
                  </div>
                  <b
                    className={`text-[15px] font-bold shrink-0 ${
                      isIn ? 'text-success' : 'text-accent'
                    }`}
                  >
                    {m.signed_quantity}
                  </b>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
