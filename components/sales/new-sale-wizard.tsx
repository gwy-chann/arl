'use client';

import React, { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { CustomerWithRollup } from '@/lib/customers/customer-contracts';
import type { ProductWithVariants, ProductVariantDTO } from '@/lib/products/product-service';
import type { SaleLineInput, PaymentStatus, OrderStatus } from '@/lib/sales/sale-contracts';
import { calculateSaleSummary } from '@/lib/sales/sale-service';
import { submitNewSale } from '@/lib/sales/sale-actions';
import { SaleLineItemRow } from './sale-line-item-row';
import { SaleSummaryCard } from './sale-summary-card';
import { useToast } from '@/components/ui/toast-provider';
import { formatPeso } from '@/lib/customers/customer-service';

export interface NewSaleWizardProps {
  customers: CustomerWithRollup[];
  products: ProductWithVariants[];
  initialCustomerId?: string;
}

export function NewSaleWizard({
  customers,
  products,
  initialCustomerId = '',
}: Readonly<NewSaleWizardProps>) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Find default product and variant
  const defaultProduct = products[0];
  const defaultVariant = defaultProduct?.variants.find((v: ProductVariantDTO) => v.size === '1L') || defaultProduct?.variants[0];

  const [customerId, setCustomerId] = useState<string>(initialCustomerId);
  const [lines, setLines] = useState<SaleLineInput[]>([
    {
      productId: defaultProduct?.id || 'prod-toyo',
      variantId: defaultVariant?.id || 'toyo-1L',
      size: defaultVariant?.size || '1L',
      quantity: 1,
      unitPrice: defaultVariant?.selling_price || 50,
      unitCost: defaultVariant?.cost_price || 38,
    },
  ]);

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Paid');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('Pending');

  // Build variant stock lookup map
  const variantStockMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products) {
      for (const v of p.variants) {
        map[v.id] = v.stock_quantity;
      }
    }
    return map;
  }, [products]);

  // Compute live financial summary & stock validation
  const summary = useMemo(() => {
    const numPaid = parseFloat(amountPaidInput) || 0;
    return calculateSaleSummary(lines, paymentStatus, numPaid, customerId, variantStockMap);
  }, [lines, paymentStatus, amountPaidInput, customerId, variantStockMap]);

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const handleAddLine = () => {
    const nextProd = products[0];
    const nextVar = nextProd?.variants[0];
    if (!nextProd || !nextVar) return;

    setLines((prev) => [
      ...prev,
      {
        productId: nextProd.id,
        variantId: nextVar.id,
        size: nextVar.size,
        quantity: 1,
        unitPrice: nextVar.selling_price,
        unitCost: nextVar.cost_price,
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateLine = <K extends keyof SaleLineInput>(
    index: number,
    field: K,
    value: SaleLineInput[K]
  ) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = () => {
    if (!summary.isValid || isPending) return;

    startTransition(async () => {
      const payload = {
        customerId,
        lines,
        paymentStatus,
        amountPaid: summary.amountPaid,
        orderStatus,
      };

      const result = await submitNewSale(payload);

      if (result.success && result.sale) {
        showToast(`Sale saved: ${result.sale.receipt_number}`);
        // Navigate to sales transaction detail or sales list
        router.push(`/sales/${result.sale.id}`);
      } else {
        showToast(result.error || 'Failed to save sale', undefined, 'danger');
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
      {/* Left Column: Customer & Line Items */}
      <div className="flex flex-col gap-5">
        {/* Customer Select Card (Fulfills Scenario 4 & ARL-10 pre-selection) */}
        <section className="bg-bg-surface border border-border rounded-[var(--r)] shadow-xs p-5">
          <label
            htmlFor="customer-select-input"
            className="block text-[14px] font-semibold text-text-primary mb-1.5"
          >
            Customer
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <select
              id="customer-select-input"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
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
        </section>

        {/* Line Items Card */}
        <section className="bg-bg-surface border border-border rounded-[var(--r)] shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-[17px] font-bold text-text-primary m-0">Items</h2>
            <button
              type="button"
              onClick={handleAddLine}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r)] bg-bg-muted hover:bg-bg-hover text-text-primary text-[13.5px] font-semibold border border-border transition-colors shadow-xs"
            >
              <svg
                className="w-4 h-4 text-text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add item
            </button>
          </div>

          <div>
            {lines.map((line, idx) => (
              <SaleLineItemRow
                key={`line-${idx}-${line.variantId}`}
                index={idx}
                line={line}
                products={products}
                isOnlyLine={lines.length <= 1}
                availableStock={variantStockMap[line.variantId] ?? 0}
                errorMessage={summary.lineErrors[idx]}
                onUpdate={handleUpdateLine}
                onRemove={handleRemoveLine}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Right Column: Sticky Summary Card */}
      <SaleSummaryCard
        totalItems={summary.totalItems}
        grossProfit={summary.grossProfit}
        grandTotal={summary.grandTotal}
        paymentStatus={paymentStatus}
        amountPaidInput={amountPaidInput}
        remainingBalance={summary.remainingBalance}
        orderStatus={orderStatus}
        hasCustomer={Boolean(customerId)}
        isValid={summary.isValid}
        isSubmitting={isPending}
        onPaymentStatusChange={setPaymentStatus}
        onAmountPaidChange={setAmountPaidInput}
        onOrderStatusChange={setOrderStatus}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
