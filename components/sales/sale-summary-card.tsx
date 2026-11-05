'use client';

import React from 'react';
import type { PaymentStatus, OrderStatus } from '@/lib/sales/sale-contracts';
import { formatPeso } from '@/lib/customers/customer-service';

export interface SaleSummaryCardProps {
  totalItems: number;
  grossProfit: number;
  grandTotal: number;
  paymentStatus: PaymentStatus;
  amountPaidInput: string;
  remainingBalance: number;
  orderStatus: OrderStatus;
  hasCustomer: boolean;
  isValid: boolean;
  isSubmitting: boolean;
  onPaymentStatusChange: (status: PaymentStatus) => void;
  onAmountPaidChange: (val: string) => void;
  onOrderStatusChange: (status: OrderStatus) => void;
  onSubmit: () => void;
}

const PAYMENT_OPTIONS: PaymentStatus[] = ['Paid', 'Partially Paid', 'Not Yet Paid'];
const ORDER_OPTIONS: OrderStatus[] = ['Pending', 'Delivered', 'Picked Up'];

export function SaleSummaryCard({
  totalItems,
  grossProfit,
  grandTotal,
  paymentStatus,
  amountPaidInput,
  remainingBalance,
  orderStatus,
  hasCustomer,
  isValid,
  isSubmitting,
  onPaymentStatusChange,
  onAmountPaidChange,
  onOrderStatusChange,
  onSubmit,
}: Readonly<SaleSummaryCardProps>) {
  return (
    <aside className="bg-bg-surface border border-border rounded-[var(--r)] shadow-xs overflow-hidden sticky top-5">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-[17px] font-bold text-text-primary m-0">Summary</h2>
      </div>

      <div className="p-5 flex flex-col gap-3.5">
        {/* Items Bottle Count */}
        <div className="flex justify-between items-center text-[14.5px] text-text-secondary">
          <span>Items</span>
          <span className="font-medium text-text-primary">
            {totalItems} {totalItems === 1 ? 'bottle' : 'bottles'}
          </span>
        </div>

        {/* Profit */}
        <div className="flex justify-between items-center text-[14.5px] text-text-secondary">
          <span>Profit</span>
          <b className="text-success font-bold text-[15px]">{formatPeso(grossProfit)}</b>
        </div>

        {/* Grand Total */}
        <div className="flex justify-between items-center pt-3 border-t border-border">
          <span className="text-[17px] font-bold text-text-primary">Total</span>
          <span className="text-[22px] font-bold text-text-primary tracking-tight">
            {formatPeso(grandTotal)}
          </span>
        </div>

        {/* Payment Status Segmented Control */}
        <div className="mt-2 flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-text-primary">Payment status</label>
          <div className="flex border border-border rounded-[var(--r)] overflow-hidden">
            {PAYMENT_OPTIONS.map((opt) => {
              const active = paymentStatus === opt;
              return (
                <label
                  key={opt}
                  className={`flex-1 text-center py-2 px-1 cursor-pointer text-[13px] transition-colors select-none border-r border-border last:border-r-0 ${
                    active
                      ? 'bg-primary-light text-primary font-bold'
                      : 'bg-bg-surface text-text-secondary hover:bg-bg-hover'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment-status"
                    value={opt}
                    checked={active}
                    onChange={() => onPaymentStatusChange(opt)}
                    className="sr-only"
                  />
                  {opt}
                </label>
              );
            })}
          </div>
        </div>

        {/* Amount Paid Field (Only for Partially Paid) */}
        {paymentStatus === 'Partially Paid' && (
          <div className="flex flex-col gap-1.5 animate-fadeIn">
            <label
              htmlFor="amount-paid-input"
              className="text-[13px] font-semibold text-text-primary"
            >
              Amount paid
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-text-muted text-[14.5px]">₱</span>
              <input
                id="amount-paid-input"
                type="number"
                min="0"
                max={grandTotal}
                step="any"
                value={amountPaidInput}
                onChange={(e) => onAmountPaidChange(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 rounded-[var(--r)] bg-bg-input border border-border focus:border-border-focus text-text-primary text-[14.5px] outline-none transition-colors"
              />
            </div>
          </div>
        )}

        {/* Remaining Balance */}
        <div className="flex justify-between items-center text-[14.5px] text-text-secondary py-1">
          <span>Remaining balance</span>
          <b
            className={`text-[15.5px] font-bold ${
              remainingBalance > 0 ? 'text-danger' : 'text-text-primary'
            }`}
          >
            {formatPeso(remainingBalance)}
          </b>
        </div>

        {/* Order Status Segmented Control */}
        <div className="mt-1 flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-text-primary">Order status</label>
          <div className="flex border border-border rounded-[var(--r)] overflow-hidden">
            {ORDER_OPTIONS.map((opt) => {
              const active = orderStatus === opt;
              return (
                <label
                  key={opt}
                  className={`flex-1 text-center py-2 px-1 cursor-pointer text-[13px] transition-colors select-none border-r border-border last:border-r-0 ${
                    active
                      ? 'bg-primary-light text-primary font-bold'
                      : 'bg-bg-surface text-text-secondary hover:bg-bg-hover'
                  }`}
                >
                  <input
                    type="radio"
                    name="order-status"
                    value={opt}
                    checked={active}
                    onChange={() => onOrderStatusChange(opt)}
                    className="sr-only"
                  />
                  {opt}
                </label>
              );
            })}
          </div>
        </div>

        {/* Save Sale Action Button */}
        <div className="mt-3">
          <button
            type="button"
            onClick={onSubmit}
            disabled={!isValid || isSubmitting}
            className="w-full py-2.5 px-4 rounded-[var(--r)] bg-primary text-text-light font-semibold hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
          >
            {isSubmitting ? 'Saving sale...' : 'Save sale'}
          </button>
          <p className="text-[12px] text-text-muted mt-2 text-center m-0">
            {!hasCustomer
              ? 'Choose a customer to save.'
              : 'You can print the receipt after saving.'}
          </p>
        </div>
      </div>
    </aside>
  );
}
