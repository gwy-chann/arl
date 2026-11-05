'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CustomerWithRollup } from '@/lib/customers/customer-contracts';
import { filterCustomers, formatCustomerBalance } from '@/lib/customers/customer-service';

interface CustomerTableProps {
  initialCustomers: CustomerWithRollup[];
}

export function CustomerTable({ initialCustomers }: Readonly<CustomerTableProps>) {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const filteredCustomers = useMemo(() => {
    return filterCustomers(initialCustomers, searchQuery);
  }, [initialCustomers, searchQuery]);

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-tight m-0">
            Customers
          </h1>
          <p className="text-[14.5px] text-text-muted mt-1 m-0">
            Your regular buyers and what they owe.
          </p>
        </div>
        <div>
          <Link
            href="/customers/new"
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
            Add customer
          </Link>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-bg-surface border border-border rounded-[var(--r)] shadow-xs overflow-hidden">
        {/* Toolbar with Search Input */}
        <div className="p-3.5 sm:p-4 border-b border-border bg-bg-surface">
          <div className="relative max-w-sm">
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
              placeholder="Search name or contact"
              aria-label="Search name or contact"
              className="w-full pl-9 pr-3 py-1.5 text-[14px] bg-bg-input text-text-primary border border-border rounded-[var(--r)] focus:outline-hidden focus:border-border-focus transition-colors placeholder:text-text-muted"
            />
          </div>
        </div>

        {/* Responsive Table / Cards */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px] border-collapse">
            <thead className="bg-bg-muted border-b border-border text-text-muted text-[12px] uppercase font-semibold tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Customer
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Contact
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Address
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-right">
                  Purchases
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-right">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-text-muted">
                    <p className="font-semibold text-text-primary text-[15px] mb-1">
                      No matching customers
                    </p>
                    <p className="text-[13.5px]">
                      {searchQuery
                        ? `No customer records matched "${searchQuery}".`
                        : 'No customers registered yet. Click "Add customer" to get started.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const bal = formatCustomerBalance(customer.debt_balance);
                  return (
                    <tr
                      key={customer.id}
                      onClick={() => router.push(`/customers/${customer.id}`)}
                      className="cursor-pointer hover:bg-bg-hover transition-colors group"
                      tabIndex={0}
                      role="button"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/customers/${customer.id}`);
                        }
                      }}
                    >
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-text-primary group-hover:text-primary transition-colors">
                          {customer.name}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-text-secondary whitespace-nowrap">
                        {customer.phone}
                      </td>
                      <td className="px-4 py-3.5 text-text-muted max-w-xs truncate">
                        {customer.address || '-'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-text-secondary">
                        {customer.purchase_count}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        {bal.isIndebted ? (
                          <b className="text-danger font-semibold">{bal.formatted}</b>
                        ) : (
                          <span className="text-text-muted">-</span>
                        )}
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
