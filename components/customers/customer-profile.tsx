'use client';

import React from 'react';
import Link from 'next/link';
import type { CustomerProfileData } from '@/lib/customers/customer-contracts';
import { formatPeso, formatCustomerBalance } from '@/lib/customers/customer-service';

interface CustomerProfileProps {
  customer: CustomerProfileData;
}

export function CustomerProfile({ customer }: Readonly<CustomerProfileProps>) {
  const bal = formatCustomerBalance(customer.debt_balance);
  const unpaidSales = customer.sales.filter((s) => s.balance > 0);

  return (
    <div className="w-full">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center gap-2 text-[13.5px] text-text-muted">
          <li>
            <Link href="/customers" className="hover:text-primary transition-colors">
              Customers
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-semibold text-text-primary truncate max-w-xs" aria-current="page">
            {customer.name}
          </li>
        </ol>
      </nav>

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-tight m-0">
            {customer.name}
          </h1>
          <p className="text-[14.5px] text-text-muted mt-1 m-0">
            {customer.phone}
            {customer.address ? ` · ${customer.address}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href={`/customers/${customer.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--r)] bg-secondary hover:bg-secondary-hover text-text-primary border border-border font-medium text-[14px] shadow-2xs transition-colors"
          >
            <svg
              className="w-4 h-4 stroke-current"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />
            </svg>
            Edit
          </Link>
          <Link
            href={`/sales/new?customerId=${customer.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--r)] bg-primary hover:bg-primary-hover text-text-light font-medium text-[14px] shadow-xs transition-colors"
          >
            <svg
              className="w-4 h-4 stroke-current"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New sale
          </Link>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Transaction Ledger */}
        <section className="lg:col-span-2 bg-bg-surface border border-border rounded-[var(--r)] shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-text-primary m-0">
              Transaction history
            </h2>
            <span className="text-[13px] text-text-muted">
              {customer.sales.length} {customer.sales.length === 1 ? 'sale' : 'sales'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px] border-collapse">
              <thead className="bg-bg-muted border-b border-border text-text-muted text-[12px] uppercase font-semibold tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Receipt
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold text-right">
                    Total
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold text-right">
                    Balance
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Payment
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">
                    Order
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customer.sales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                      <p className="font-semibold text-text-primary text-[14.5px] mb-1">
                        No purchases yet
                      </p>
                      <p className="text-[13px]">
                        Record a sale to start this customer&apos;s transaction history.
                      </p>
                    </td>
                  </tr>
                ) : (
                  customer.sales.map((sale) => {
                    const dateFormatted = new Date(sale.created_at).toLocaleDateString(
                      'en-PH',
                      {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }
                    );
                    const sbal = formatCustomerBalance(sale.balance);

                    return (
                      <tr key={sale.id} className="hover:bg-bg-hover transition-colors">
                        <td className="px-4 py-3 font-semibold text-text-primary">
                          {sale.receipt_number}
                        </td>
                        <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                          {dateFormatted}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-text-primary">
                          {formatPeso(sale.total_amount)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {sbal.isIndebted ? (
                            <b className="text-danger font-semibold">{sbal.formatted}</b>
                          ) : (
                            <span className="text-text-muted">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 text-[12px] font-semibold rounded-full ${
                              sale.payment_status === 'Paid'
                                ? 'bg-success-light text-success'
                                : sale.payment_status === 'Partially Paid'
                                ? 'bg-accent-light text-accent'
                                : 'bg-danger-light text-danger'
                            }`}
                          >
                            {sale.payment_status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 text-[12px] font-semibold rounded-full ${
                              sale.order_status === 'Pending'
                                ? 'bg-accent-light text-accent'
                                : 'bg-info-light text-info'
                            }`}
                          >
                            {sale.order_status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Column (1/3): Outstanding Balance Card */}
        <aside className="bg-bg-surface border border-border rounded-[var(--r)] shadow-xs overflow-hidden h-fit">
          <div className="px-5 py-3.5 border-b border-border">
            <h2 className="text-[16px] font-semibold text-text-primary m-0">
              Outstanding balance
            </h2>
          </div>
          <div className="p-5">
            <div
              className={`text-[30px] font-bold tracking-tight ${
                bal.isIndebted ? 'text-danger' : 'text-text-primary'
              }`}
            >
              {formatPeso(customer.debt_balance)}
            </div>

            {unpaidSales.length > 0 ? (
              <div className="mt-2">
                <p className="text-[13px] text-text-muted mb-3">
                  Across {unpaidSales.length}{' '}
                  {unpaidSales.length > 1 ? 'unpaid sales' : 'unpaid sale'}.
                </p>
                <div className="space-y-2 border-t border-border pt-3">
                  {unpaidSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between text-[13.5px] py-1 border-b border-border/50 last:border-0"
                    >
                      <span className="font-medium text-text-primary">
                        {sale.receipt_number}
                      </span>
                      <span className="font-semibold text-danger">
                        {formatPeso(sale.balance)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[13.5px] text-text-muted mt-2">
                Fully paid. Nothing is owed.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
