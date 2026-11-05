'use client';

import React from 'react';
import type { SaleLineInput, PackagingSize } from '@/lib/sales/sale-contracts';
import type { ProductWithVariants, ProductVariantDTO } from '@/lib/products/product-service';
import { formatPeso } from '@/lib/customers/customer-service';

export interface SaleLineItemRowProps {
  index: number;
  line: SaleLineInput;
  products: ProductWithVariants[];
  isOnlyLine: boolean;
  availableStock: number;
  errorMessage?: string;
  onUpdate: <K extends keyof SaleLineInput>(index: number, field: K, value: SaleLineInput[K]) => void;
  onRemove: (index: number) => void;
}

const SIZE_LABELS: Record<PackagingSize, string> = {
  '350': '350 ml',
  '1L': '1 L',
  gal: '1 gal',
};

export function SaleLineItemRow({
  index,
  line,
  products,
  isOnlyLine,
  availableStock,
  errorMessage,
  onUpdate,
  onRemove,
}: Readonly<SaleLineItemRowProps>) {
  const currentProduct = products.find((p) => p.id === line.productId) || products[0];
  const variants: ProductVariantDTO[] = currentProduct?.variants || [];

  const isOverStock = line.quantity > availableStock;

  const handleProductChange = (newProductId: string) => {
    const prod = products.find((p) => p.id === newProductId);
    if (!prod || !prod.variants.length) return;
    const firstVariant = prod.variants[0];
    onUpdate(index, 'productId', newProductId);
    onUpdate(index, 'variantId', firstVariant.id);
    onUpdate(index, 'size', firstVariant.size);
    onUpdate(index, 'unitPrice', firstVariant.selling_price);
    onUpdate(index, 'unitCost', firstVariant.cost_price);
  };

  const handleSizeChange = (newSize: PackagingSize) => {
    const variant = variants.find((v: ProductVariantDTO) => v.size === newSize);
    if (!variant) return;
    onUpdate(index, 'variantId', variant.id);
    onUpdate(index, 'size', newSize);
    onUpdate(index, 'unitPrice', variant.selling_price);
    onUpdate(index, 'unitCost', variant.cost_price);
  };

  const handleQuantityStep = (delta: number) => {
    const nextQty = Math.max(1, line.quantity + delta);
    onUpdate(index, 'quantity', nextQty);
  };

  const handleQuantityInput = (val: string) => {
    const parsed = parseInt(val, 10);
    if (!Number.isNaN(parsed)) {
      onUpdate(index, 'quantity', Math.max(1, parsed));
    }
  };

  const lineTotal = line.quantity * line.unitPrice;

  return (
    <div className="p-4 border-b border-border/70 last:border-b-0 grid grid-cols-1 sm:grid-cols-[1.2fr_1fr_120px_110px_36px] gap-3 items-end">
      {/* Product Selector */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor={`line-product-${index}`}
          className="text-[13px] font-semibold text-text-primary"
        >
          Product
        </label>
        <select
          id={`line-product-${index}`}
          value={line.productId}
          onChange={(e) => handleProductChange(e.target.value)}
          aria-label="Product"
          className="w-full px-3 py-2 rounded-[var(--r)] bg-bg-input border border-border focus:border-border-focus text-text-primary text-[14.5px] outline-none transition-colors"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Packaging Size Selector */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor={`line-size-${index}`}
          className="text-[13px] font-semibold text-text-primary"
        >
          Size
        </label>
        <select
          id={`line-size-${index}`}
          value={line.size}
          onChange={(e) => handleSizeChange(e.target.value as PackagingSize)}
          aria-label="Size"
          className="w-full px-3 py-2 rounded-[var(--r)] bg-bg-input border border-border focus:border-border-focus text-text-primary text-[14.5px] outline-none transition-colors"
        >
          {variants.map((v: ProductVariantDTO) => (
            <option key={v.id} value={v.size}>
              {SIZE_LABELS[v.size as PackagingSize]} · {formatPeso(v.selling_price)}
            </option>
          ))}
        </select>
      </div>

      {/* Quantity Stepper */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor={`line-qty-${index}`}
          className="text-[13px] font-semibold text-text-primary"
        >
          Quantity
        </label>
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => handleQuantityStep(-1)}
            disabled={line.quantity <= 1}
            aria-label="Decrease"
            className="w-9 h-[38px] flex items-center justify-center rounded-l-[var(--r)] border border-border bg-bg-muted hover:bg-bg-hover text-text-primary transition-colors text-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            −
          </button>
          <input
            id={`line-qty-${index}`}
            type="number"
            min={1}
            value={line.quantity}
            onChange={(e) => handleQuantityInput(e.target.value)}
            aria-label="Quantity"
            className="w-14 h-[38px] border-y border-border bg-bg-input text-text-primary text-center text-[15px] font-semibold outline-none focus:border-border-focus"
          />
          <button
            type="button"
            onClick={() => handleQuantityStep(1)}
            aria-label="Increase"
            className="w-9 h-[38px] flex items-center justify-center rounded-r-[var(--r)] border border-border bg-bg-muted hover:bg-bg-hover text-text-primary transition-colors text-lg font-bold"
          >
            +
          </button>
        </div>
      </div>

      {/* Line Subtotal */}
      <div className="text-right sm:text-right font-semibold text-[15.5px] pb-2 text-text-primary">
        {formatPeso(lineTotal)}
      </div>

      {/* Remove Button */}
      <div className="flex justify-end pb-1.5">
        <button
          type="button"
          onClick={() => onRemove(index)}
          disabled={isOnlyLine}
          aria-label="Remove item"
          className="w-9 h-[38px] flex items-center justify-center rounded-[var(--r)] text-text-muted hover:text-danger hover:bg-danger-light/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Stock Note (Fulfills Scenario 3) */}
      <div className="col-span-1 sm:col-span-5 -mt-1 text-[13px]">
        {isOverStock || errorMessage ? (
          <span className="text-danger">
            <b className="font-bold">Only {availableStock} in stock.</b> Lower the quantity.
          </span>
        ) : (
          <span className="text-text-muted">
            Unit price {formatPeso(line.unitPrice)} · {availableStock - line.quantity} will remain after this sale
          </span>
        )}
      </div>
    </div>
  );
}
