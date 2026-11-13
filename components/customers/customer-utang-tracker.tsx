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
      <nav aria-label="Breadcrumb" className="mb-4">
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
      <div
        className="stats grid-cols-1 sm:grid-cols-3 !grid-cols-1 sm:!grid-cols-3"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
      >
        <div className="stat">
          <span>Total owed</span>
          <b>{formatPeso(initialSummary.total_owed)}</b>
          <small>
            {initialSummary.total_debtors}{' '}
            {initialSummary.total_debtors === 1 ? 'customer' : 'customers'}
          </small>
        </div>

        <div className={`stat ${initialSummary.overdue_owed > 0 ? 'alert' : ''}`}>
          <span>Overdue ({initialSummary.reminder_days}+ days)</span>
          <b className={initialSummary.overdue_owed > 0 ? 'text-danger' : ''}>
            {formatPeso(initialSummary.overdue_owed)}
          </b>
          <small>
            {initialSummary.overdue_debtors}{' '}
            {initialSummary.overdue_debtors === 1 ? 'customer' : 'customers'}
          </small>
        </div>

        <div className="stat">
          <span>Reminders</span>
          <b className="text-[17px] pt-1.5 truncate">
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
        <div className="toolbar p-3.5 sm:p-4 border-b border-border bg-bg-surface flex items-center justify-between">
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
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-bg-input text-text-primary placeholder:text-text-muted border border-border rounded-[var(--r)] focus:outline-none focus:border-border-focus transition-colors"
            />
          </div>
        </div>

        {/* Table Wrap */}
        <div className="tbl-wrap">
          <table className="tbl-cards">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Oldest unpaid sale</th>
                <th className="num text-right">Days outstanding</th>
                <th className="num text-right">Balance</th>
                <th>Status</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.customer_id}>
                  <td data-label="Customer">
                    <b className="font-semibold text-text-primary">
                      {row.customer_name}
                    </b>
                    <br />
                    <span className="text-text-muted text-xs">{row.phone}</span>
                  </td>

                  <td data-label="Oldest Unpaid">
                    <Link
                      href={`/sales/${row.oldest_sale_id}`}
                      className="text-primary hover:underline font-semibold"
                    >
                      {row.oldest_receipt_number}
                    </Link>
                    <br />
                    <span className="text-text-muted text-xs">
                      {formatDate(row.oldest_sale_date)}
                    </span>
                  </td>

                  <td
                    data-label="Days Overdue"
                    className="num text-right tabular-nums"
                  >
                    {row.days_outstanding}
                  </td>

                  <td
                    data-label="Balance"
                    className="num text-right tabular-nums"
                  >
                    <b className="font-bold text-danger">
                      {formatPeso(row.total_balance)}
                    </b>
                  </td>

                  <td data-label="Status">
                    {row.status === 'Overdue' ? (
                      <span className="pill bad">Overdue</span>
                    ) : (
                      <span className="pill warn">Not yet due</span>
                    )}
                  </td>

                  <td
                    data-label="Action"
                    className="actions-td"
                    style={{ textAlign: 'right' }}
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
            <div className="empty">
              <b>No balances</b>
              <p>
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
