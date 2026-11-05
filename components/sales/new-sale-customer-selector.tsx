'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { CustomerWithRollup } from '@/lib/customers/customer-contracts';
import { formatPeso } from '@/lib/customers/customer-service';

interface NewSaleCustomerSelectorProps {
  customers: CustomerWithRollup[];
  initialCustomerId?: string;
}

export function NewSaleCustomerSelector({
  customers,
  initialCustomerId = '',
}: Readonly<NewSaleCustomerSelectorProps>) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <section className="bg-bg-surface border border-border rounded-[var(--r)] shadow-xs mb-6 overflow-hidden">
      <div className="p-5">
        <label
          htmlFor="customer-select"
          className="block text-[14px] font-semibold text-text-primary mb-1.5"
        >
          Customer
        </label>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <select
            id="customer-select"
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full sm:max-w-md px-3 py-2 rounded-[var(--r)] bg-bg-input border border-border focus:border-border-focus text-text-primary text-[14.5px] outline-none transition-colors"
          >
            <option value="">Choose a customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.debt_balance > 0 ? ` (owes ${formatPeso(c.debt_balance)})` : ''}
              </option>
            ))}
          </select>
          <span className="text-[13px] text-text-muted">
            New customer?{' '}
            <Link
              href="/customers/new"
              className="text-primary hover:text-primary-hover font-medium underline underline-offset-2"
            >
              Add customer
            </Link>
          </span>
        </div>

        {selectedCustomer && (
          <div className="mt-3.5 p-3 rounded-[var(--r)] bg-bg-muted border border-border/60 flex flex-wrap items-center justify-between gap-2 text-[13.5px]">
            <div>
              <span className="font-semibold text-text-primary">{selectedCustomer.name}</span>
              <span className="text-text-muted ml-2">
                {selectedCustomer.phone}
                {selectedCustomer.address ? ` · ${selectedCustomer.address}` : ''}
              </span>
            </div>
            {selectedCustomer.debt_balance > 0 ? (
              <span className="text-danger font-semibold">
                Outstanding utang: {formatPeso(selectedCustomer.debt_balance)}
              </span>
            ) : (
              <span className="text-success font-medium">Account settled (₱0.00 debt)</span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
