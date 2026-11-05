import React from 'react';
import type { PaymentStatus, OrderStatus } from '@/lib/sales/sale-contracts';

export interface PaymentStatusPillProps {
  status: PaymentStatus;
  isOverdue?: boolean;
  className?: string;
}

export function PaymentStatusPill({
  status,
  isOverdue = false,
  className = '',
}: Readonly<PaymentStatusPillProps>) {
  const styles = {
    Paid: 'pill ok bg-success-light text-success border border-success-border',
    'Partially Paid': 'pill warn bg-accent-light text-accent border border-accent-border',
    'Not Yet Paid': 'pill bad bg-danger-light text-danger border border-danger-border',
  }[status];

  return (
    <div className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[13px] font-semibold leading-[22px] whitespace-nowrap ${styles}`}
      >
        {status}
      </span>
      {isOverdue && (
        <span
          className="pill bad bg-danger-light text-danger border border-danger-border inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[13px] font-semibold leading-[22px] whitespace-nowrap"
        >
          Overdue
        </span>
      )}
    </div>
  );
}

export interface OrderStatusPillProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusPill({
  status,
  className = '',
}: Readonly<OrderStatusPillProps>) {
  const styles = {
    Pending: 'pill warn bg-accent-light text-accent border border-accent-border',
    Delivered: 'pill info bg-info-light text-info border border-info-border',
    'Picked Up': 'pill info bg-info-light text-info border border-info-border',
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[13px] font-semibold leading-[22px] whitespace-nowrap ${styles} ${className}`}
    >
      {status}
    </span>
  );
}
