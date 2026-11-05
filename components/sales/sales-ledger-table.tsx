'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { SaleTransactionDTO } from '@/lib/sales/sale-contracts';
import { formatPeso } from '@/lib/customers/customer-service';
import { PaymentStatusPill, OrderStatusPill } from './sale-status-pill';

export interface SalesLedgerTableProps {
  sales: SaleTransactionDTO[];
}

function formatSaleDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export function SalesLedgerTable({ sales }: Readonly<SalesLedgerTableProps>) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [orderFilter, setOrderFilter] = useState<string>('');

  const filteredSales = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sales.filter((s) => {
      // Search match
      const receiptMatch = s.receipt_number.toLowerCase().includes(q);
      const customerMatch = (s.customer_name || '').toLowerCase().includes(q);
      const matchesSearch = !q || receiptMatch || customerMatch;

      // Payment filter match
      const matchesPayment = !paymentFilter || s.payment_status === paymentFilter;

      // Order filter match
      const matchesOrder = !orderFilter || s.order_status === orderFilter;

      return matchesSearch && matchesPayment && matchesOrder;
    });
  }, [sales, searchQuery, paymentFilter, orderFilter]);

  const handleRowClick = (saleId: string) => {
    router.push(`/sales/${saleId}`);
  };

  return (
    <div className="card bg-bg-card border border-border rounded-xl shadow-xs overflow-hidden">
      {/* Toolbar */}
      <div className="toolbar flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 border-b border-border bg-bg-surface">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted">
            <svg
              className="w-4 h-4"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search receipt or customer"
            aria-label="Search receipt or customer"
            className="w-full pl-9 pr-3 py-2 text-sm bg-bg-input border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-hidden focus:border-border-focus"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            aria-label="Payment status"
            className="px-3 py-2 text-sm bg-bg-input border border-border rounded-lg text-text-primary focus:outline-hidden focus:border-border-focus cursor-pointer"
          >
            <option value="">All payments</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Not Yet Paid">Not Yet Paid</option>
          </select>

          <select
            value={orderFilter}
            onChange={(e) => setOrderFilter(e.target.value)}
            aria-label="Order status"
            className="px-3 py-2 text-sm bg-bg-input border border-border rounded-lg text-text-primary focus:outline-hidden focus:border-border-focus cursor-pointer"
          >
            <option value="">All orders</option>
            <option value="Pending">Pending</option>
            <option value="Delivered">Delivered</option>
            <option value="Picked Up">Picked Up</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="tbl-wrap overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse tbl-cards">
          <thead>
            <tr className="border-b border-border bg-bg-muted/50 text-text-muted font-medium">
              <th scope="col" className="py-3 px-4">Receipt</th>
              <th scope="col" className="py-3 px-4">Date</th>
              <th scope="col" className="py-3 px-4">Customer</th>
              <th scope="col" className="py-3 px-4 text-right">Total</th>
              <th scope="col" className="py-3 px-4 text-right">Balance</th>
              <th scope="col" className="py-3 px-4">Payment</th>
              <th scope="col" className="py-3 px-4">Order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredSales.map((s) => (
              <tr
                key={s.id}
                onClick={() => handleRowClick(s.id)}
                className="cursor-pointer hover:bg-bg-hover transition-colors group"
                tabIndex={0}
                role="link"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRowClick(s.id);
                  }
                }}
              >
                <td data-label="Receipt" className="py-3.5 px-4 font-semibold text-text-primary group-hover:text-primary transition-colors">
                  {s.receipt_number}
                </td>
                <td data-label="Date" className="py-3.5 px-4 text-text-secondary whitespace-nowrap">
                  {formatSaleDate(s.created_at)}
                </td>
                <td data-label="Customer" className="py-3.5 px-4 text-text-primary font-medium">
                  {s.customer_name || 'Walk-in Customer'}
                </td>
                <td data-label="Total" className="py-3.5 px-4 text-right font-semibold text-text-primary whitespace-nowrap">
                  {formatPeso(s.total_amount)}
                </td>
                <td data-label="Balance" className="py-3.5 px-4 text-right whitespace-nowrap">
                  {s.balance > 0 ? (
                    <b className="text-danger font-semibold">{formatPeso(s.balance)}</b>
                  ) : (
                    <span className="text-text-muted">-</span>
                  )}
                </td>
                <td data-label="Payment" className="py-3.5 px-4">
                  <PaymentStatusPill
                    status={s.payment_status}
                    isOverdue={Boolean(s.is_overdue)}
                  />
                </td>
                <td data-label="Order" className="py-3.5 px-4">
                  <OrderStatusPill status={s.order_status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSales.length === 0 && (
          <div className="py-12 text-center text-text-muted">
            No sales found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
}
