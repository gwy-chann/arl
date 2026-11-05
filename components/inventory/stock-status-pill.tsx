import React from 'react';
import type { StockHealthStatus, BadgeVariant } from '@/lib/inventory/types';

export interface StockStatusPillProps {
  status: StockHealthStatus;
  label?: string;
  variant?: BadgeVariant;
  className?: string;
}

export function StockStatusPill({
  status,
  label,
  variant,
  className = '',
}: Readonly<StockStatusPillProps>) {
  let resolvedLabel = label;
  let resolvedVariant = variant;

  if (!resolvedLabel || !resolvedVariant) {
    switch (status) {
      case 'out-of-stock':
        resolvedLabel = resolvedLabel || 'Out of stock';
        resolvedVariant = resolvedVariant || 'bad';
        break;
      case 'low-stock':
        resolvedLabel = resolvedLabel || 'Low stock';
        resolvedVariant = resolvedVariant || 'warn';
        break;
      case 'getting-low':
        resolvedLabel = resolvedLabel || 'Getting low';
        resolvedVariant = resolvedVariant || 'warn';
        break;
      case 'in-stock':
      default:
        resolvedLabel = resolvedLabel || 'In stock';
        resolvedVariant = resolvedVariant || 'ok';
        break;
    }
  }

  const variantStyles = {
    ok: 'pill ok bg-success-light text-success border border-success-border',
    warn: 'pill warn bg-accent-light text-accent border border-accent-border',
    bad: 'pill bad bg-danger-light text-danger border border-danger-border',
  }[resolvedVariant];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
        text-[13px] font-semibold leading-[22px] whitespace-nowrap
        ${variantStyles}
        ${className}
      `}
    >
      {resolvedLabel}
    </span>
  );
}
