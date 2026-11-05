'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { OrderStatus } from '@/lib/sales/sale-contracts';
import { updateSaleOrderStatusAction } from '@/lib/sales/sale-actions';
import { OrderStatusPill } from './sale-status-pill';
import { useToast } from '@/components/ui/toast-provider';

export interface SaleOrderManagerProps {
  saleId: string;
  initialOrderStatus: OrderStatus;
}

export function SaleOrderManager({
  saleId,
  initialOrderStatus,
}: Readonly<SaleOrderManagerProps>) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [orderStatus, setOrderStatus] = useState<OrderStatus>(initialOrderStatus);

  const handleSaveOrder = () => {
    startTransition(async () => {
      const result = await updateSaleOrderStatusAction({
        saleId,
        orderStatus,
      });

      if (result.success) {
        showToast(`Order marked ${orderStatus}`, 3500, 'success');
        router.refresh();
      } else {
        showToast(result.error || 'Failed to update order status.', 3500, 'danger');
      }
    });
  };

  return (
    <section className="card bg-bg-card border border-border rounded-xl shadow-xs overflow-hidden">
      <div className="card-h flex items-center justify-between p-4 border-b border-border bg-bg-surface">
        <h2 className="text-base font-semibold text-text-primary">Order</h2>
        <OrderStatusPill status={orderStatus} />
      </div>

      <div className="card-b p-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Update order status
          </label>
          <div className="seg grid grid-cols-3 gap-1 bg-bg-muted p-1 rounded-lg border border-border">
            {(['Pending', 'Delivered', 'Picked Up'] as OrderStatus[]).map((st) => {
              const isSelected = orderStatus === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setOrderStatus(st)}
                  className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-all text-center ${
                    isSelected
                      ? 'bg-bg-surface text-text-primary shadow-xs'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveOrder}
          disabled={isPending}
          className="btn w-full py-2.5 px-4 bg-primary text-text-light font-semibold rounded-lg hover:bg-primary-hover active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isPending ? 'Saving...' : 'Save order status'}
        </button>
      </div>
    </section>
  );
}
