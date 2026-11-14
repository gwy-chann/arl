'use client';

import React, { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast-provider';
import type { CustomerUtangSummaryDTO } from '@/lib/customers/customer-contracts';
import { formatPeso } from '@/lib/customers/customer-service';
import { sendCustomerSmsReminderAction } from '@/lib/customers/customer-actions';

export interface CustomerUtangTrackerProps {
  initialSummary: CustomerUtangSummaryDTO;
}

export function CustomerUtangTracker({
  initialSummary,
}: Readonly<CustomerUtangTrackerProps>) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSendingId, setActiveSendingId] = useState<string | null>(null);
  const [cooldownSet, setCooldownSet] = useState<Set<string>>(new Set());

  const filteredRows = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) {
      return initialSummary.rows;
    }
    return initialSummary.rows.filter(
      (row) =>
        row.customer_name.toLowerCase().includes(trimmed) ||
        row.phone.toLowerCase().includes(trimmed) ||
        row.oldest_receipt_number.toLowerCase().includes(trimmed)
    );
  }, [initialSummary.rows, searchQuery]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleSendSms = (
    customerId: string,
    saleId: string,
    customerName: string,
    phone: string
  ) => {
    if (!phone || !phone.trim()) {
      showToast('Cannot send SMS: No phone number on record', undefined, 'danger');
      return;
    }

    setActiveSendingId(customerId);
    startTransition(async () => {
      const res = await sendCustomerSmsReminderAction({
        customerId,
        saleId,
      });

      setActiveSendingId(null);

      if (!res.success) {
        showToast(res.error || 'Failed to send SMS reminder', undefined, 'danger');
        return;
      }

      setCooldownSet((prev) => new Set(prev).add(customerId));
      showToast(`SMS reminder sent to ${customerName}`);
    });
  };

  return (
    <div className="w-full">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-3">
        <ol className="flex items-center gap-2 text-[13.5px] text-text-muted">
          <li>
            <Link
              href="/customers"
              className="hover:text-primary transition-colors"
            >
              Customers
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-semibold text-text-primary" aria-current="page">
            Balances
          </li>
        </ol>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-tight m-0">
            Customers with balances (utang)
          </h1>
          <p className="text-[14.5px] text-text-muted mt-1 m-0">
            Unpaid and partially paid sales.
          </p>
        </div>
      </div>

      {/* 3-Column Receivables & Reminder KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 bg-bg-surface border border-border rounded-lg mb-6 divide-y md:divide-y-0 md:divide-x divide-border overflow-hidden">
        <div className="stat p-5">
          <span>Total owed</span>
          <b>{formatPeso(initialSummary.total_owed)}</b>
          <small>
            {initialSummary.total_debtors}{' '}
            {initialSummary.total_debtors === 1 ? 'customer' : 'customers'}
          </small>
        </div>

        <div className={`stat p-5 ${initialSummary.overdue_owed > 0 ? 'alert' : ''}`}>
          <span>Overdue ({initialSummary.reminder_days}+ days)</span>
          <b className={initialSummary.overdue_owed > 0 ? 'text-danger' : ''}>
            {formatPeso(initialSummary.overdue_owed)}
          </b>
          <small>
            {initialSummary.overdue_debtors}{' '}
            {initialSummary.overdue_debtors === 1 ? 'customer' : 'customers'}
          </small>
        </div>

        <div className="stat p-5">
          <span>Reminders</span>
          <b className="text-[17px] pt-1.5 truncate text-text-primary">
            SMS to {initialSummary.admin_mobile}
          </b>
          <small>
            after {initialSummary.reminder_days} days unpaid
            {initialSummary.notify_customer_sms ? ' · Customer SMS on' : ' · Customer SMS off'}
          </small>
        </div>
      </div>

      {/* Debt Table Card */}
      <div className="card">
        {/* Search Toolbar */}
        <div className="p-3.5 sm:p-4 border-b border-border bg-bg-surface flex items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
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
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, contact, or receipt"
              aria-label="Search name, contact, or receipt"
              className="w-full pl-9 pr-4 py-2 text-sm bg-bg-input text-text-primary placeholder:text-text-muted border border-border rounded-md focus:outline-none focus:border-border-focus transition-colors"
            />
          </div>
          <div className="text-xs text-text-muted whitespace-nowrap hidden sm:block">
            {filteredRows.length} {filteredRows.length === 1 ? 'debtor' : 'debtors'}
          </div>
        </div>

        {/* Table Wrap */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse tbl-cards">
            <thead>
              <tr className="border-b border-border bg-bg-surface text-[13.5px] font-semibold text-text-muted">
                <th scope="col" className="py-3 px-4 font-semibold text-text-muted" style={{ width: '26%' }}>
                  Customer
                </th>
                <th scope="col" className="py-3 px-4 font-semibold text-text-muted" style={{ width: '22%' }}>
                  Oldest unpaid sale
                </th>
                <th scope="col" className="py-3 px-4 font-semibold text-text-muted text-right" style={{ width: '15%' }}>
                  Days outstanding
                </th>
                <th scope="col" className="py-3 px-4 font-semibold text-text-muted text-right" style={{ width: '15%' }}>
                  Balance
                </th>
                <th scope="col" className="py-3 px-4 font-semibold text-text-muted" style={{ width: '12%' }}>
                  Status
                </th>
                <th scope="col" className="py-3 px-4 text-right" style={{ width: '10%' }}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRows.map((row) => (
                <tr
                  key={row.customer_id}
                  className="hover:bg-bg-hover transition-colors"
                >
                  <td data-label="Customer" className="py-3.5 px-4 align-middle">
                    <Link
                      href={`/customers/${row.customer_id}`}
                      className="font-semibold text-text-primary hover:text-primary transition-colors text-[14.5px] block"
                    >
                      {row.customer_name}
                    </Link>
                    <span className="text-text-muted text-xs block mt-0.5">
                      {row.phone || '-'}
                    </span>
                  </td>

                  <td data-label="Oldest unpaid sale" className="py-3.5 px-4 align-middle">
                    <Link
                      href={`/sales/${row.oldest_sale_id}`}
                      className="text-primary hover:underline font-semibold text-[14px] inline-block"
                    >
                      {row.oldest_receipt_number}
                    </Link>
                    <span className="text-text-muted text-xs block mt-0.5">
                      {formatDate(row.oldest_sale_date)}
                    </span>
                  </td>

                  <td
                    data-label="Days outstanding"
                    className="num py-3.5 px-4 align-middle text-right tabular-nums text-text-secondary font-medium"
                  >
                    {row.days_outstanding}
                  </td>

                  <td
                    data-label="Balance"
                    className="num py-3.5 px-4 align-middle text-right tabular-nums"
                  >
                    <b className="font-bold text-danger text-[15px]">
                      {formatPeso(row.total_balance)}
                    </b>
                  </td>

                  <td data-label="Status" className="py-3.5 px-4 align-middle whitespace-nowrap">
                    {row.status === 'Overdue' ? (
                      <span className="pill bad">Overdue</span>
                    ) : (
                      <span className="pill warn">Not yet due</span>
                    )}
                  </td>

                  <td
                    data-label="Action"
                    className="actions-td py-3.5 px-4 align-middle text-right whitespace-nowrap"
                  >
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleSendSms(
                            row.customer_id,
                            row.oldest_sale_id,
                            row.customer_name,
                            row.phone
                          )
                        }
                        disabled={
                          isPending ||
                          activeSendingId === row.customer_id ||
                          cooldownSet.has(row.customer_id) ||
                          !row.phone ||
                          !row.phone.trim()
                        }
                        className="btn sec sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        title={
                          !row.phone || !row.phone.trim()
                            ? 'No phone number on record'
                            : cooldownSet.has(row.customer_id)
                            ? 'Reminder sent recently'
                            : 'Send SMS Reminder'
                        }
                      >
                        {activeSendingId === row.customer_id ? (
                          'Sending...'
                        ) : cooldownSet.has(row.customer_id) ? (
                          'Sent'
                        ) : (
                          'Send SMS'
                        )}
                      </button>

                      <Link
                        href={`/customers/${row.customer_id}`}
                        className="btn sec sm"
                      >
                        Open profile
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRows.length === 0 && (
            <div className="empty p-10 text-center">
              <b className="text-text-primary text-base font-semibold block mb-1">
                No balances
              </b>
              <p className="text-text-muted text-sm m-0">
                {searchQuery
                  ? 'No customers match your search.'
                  : 'All customer accounts are fully paid.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
