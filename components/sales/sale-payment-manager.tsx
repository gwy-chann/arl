'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { PaymentStatus } from '@/lib/sales/sale-contracts';
import { updateSalePaymentAction } from '@/lib/sales/sale-actions';
import { formatPeso } from '@/lib/customers/customer-service';
import { PaymentStatusPill } from './sale-status-pill';
import { useToast } from '@/components/ui/toast-provider';

export interface SalePaymentManagerProps {
  saleId: string;
  totalAmount: number;
  initialAmountPaid: number;
  initialPaymentStatus: PaymentStatus;
  initialBalance: number;
}

export function SalePaymentManager({
  saleId,
  totalAmount,
  initialAmountPaid,
  initialPaymentStatus,
}: Readonly<SalePaymentManagerProps>) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(initialPaymentStatus);
  const [amountPaidInput, setAmountPaidInput] = useState<string>(
    initialPaymentStatus === 'Partially Paid' ? String(initialAmountPaid) : ''
  );

  // Derived display values
  const displayAmountPaid = (() => {
    if (paymentStatus === 'Paid') return totalAmount;
    if (paymentStatus === 'Not Yet Paid') return 0;
    const parsed = Number(amountPaidInput);
    return Number.isNaN(parsed) || parsed < 0 ? 0 : Math.min(parsed, totalAmount);
  })();

  const displayBalance = Math.max(0, Math.round((totalAmount - displayAmountPaid + Number.EPSILON) * 100) / 100);

  const handleStatusChange = (status: PaymentStatus) => {
    setPaymentStatus(status);
    if (status === 'Partially Paid' && !amountPaidInput) {
      setAmountPaidInput(String(Math.round(totalAmount / 2)));
    }
  };

  const handleSavePayment = () => {
    if (paymentStatus === 'Partially Paid') {
      const parsed = Number(amountPaidInput);
      if (Number.isNaN(parsed) || parsed <= 0 || parsed >= totalAmount) {
        showToast(`Enter an amount between ₱1 and ${formatPeso(totalAmount - 1)}`, 3500, 'danger');
        return;
      }
    }

    startTransition(async () => {
      const result = await updateSalePaymentAction({
        saleId,
        paymentStatus,
        amountPaid: paymentStatus === 'Partially Paid' ? Number(amountPaidInput) : undefined,
      });

      if (result.success) {
        const msg =
          paymentStatus === 'Paid'
            ? 'Payment updated: Paid. Reminders stopped.'
            : `Payment updated: ${paymentStatus}`;
        showToast(msg, 3500, 'success');
        router.refresh();
      } else {
        showToast(result.error || 'Failed to update payment status.', 3500, 'danger');
      }
    });
  };

  return (
    <section className="card bg-bg-card border border-border rounded-xl shadow-xs overflow-hidden">
      <div className="card-h flex items-center justify-between p-4 border-b border-border bg-bg-surface">
        <h2 className="text-base font-semibold text-text-primary">Payment</h2>
        <PaymentStatusPill status={paymentStatus} />
      </div>

      <div className="card-b p-4 space-y-3">
        <div className="flex items-center justify-between text-sm py-1 border-b border-border-subtle">
          <span className="text-text-secondary">Total</span>
          <b className="font-semibold text-text-primary">{formatPeso(totalAmount)}</b>
        </div>
        <div className="flex items-center justify-between text-sm py-1 border-b border-border-subtle">
          <span className="text-text-secondary">Amount paid</span>
          <b className="font-semibold text-text-primary">{formatPeso(displayAmountPaid)}</b>
        </div>
        <div className="flex items-center justify-between text-sm py-1 border-b border-border-subtle">
          <span className="text-text-secondary">Remaining balance</span>
          <b className={displayBalance > 0 ? 'text-danger font-semibold' : 'text-text-primary font-semibold'}>
            {formatPeso(displayBalance)}
          </b>
        </div>

        {/* Segmented Control */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
            Update payment status
          </label>
          <div className="seg grid grid-cols-3 gap-1 bg-bg-muted p-1 rounded-lg border border-border">
            {(['Paid', 'Partially Paid', 'Not Yet Paid'] as PaymentStatus[]).map((st) => {
              const isSelected = paymentStatus === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleStatusChange(st)}
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

        {/* Partial payment amount input */}
        {paymentStatus === 'Partially Paid' && (
          <div className="pt-1">
            <label htmlFor="sdp" className="block text-xs font-medium text-text-secondary mb-1">
              Amount paid (₱)
            </label>
            <input
              id="sdp"
              type="number"
              min="1"
              max={totalAmount - 1}
              step="any"
              value={amountPaidInput}
              onChange={(e) => setAmountPaidInput(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 text-sm bg-bg-input border border-border rounded-lg text-text-primary focus:outline-hidden focus:border-border-focus"
            />
          </div>
        )}

        <button
          type="button"
          onClick={handleSavePayment}
          disabled={isPending}
          className="btn w-full mt-2 py-2.5 px-4 bg-primary text-text-light font-semibold rounded-lg hover:bg-primary-hover active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isPending ? 'Saving...' : 'Save payment'}
        </button>
      </div>
    </section>
  );
}
