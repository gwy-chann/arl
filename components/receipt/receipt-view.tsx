import React from 'react';
import type { ReceiptSnapshot } from '@/lib/receipt/receipt-contracts';
import { formatPeso } from '@/lib/receipt/receipt-service';

export interface ReceiptViewProps {
  receipt: ReceiptSnapshot;
}

export function ReceiptView({ receipt }: Readonly<ReceiptViewProps>) {
  let stampColorClass = 'text-success';
  if (receipt.payment_status === 'PARTIALLY PAID') {
    stampColorClass = 'text-accent';
  } else if (receipt.payment_status === 'NOT YET PAID') {
    stampColorClass = 'text-danger';
  }

  return (
    <div className="receipt-wrap flex justify-center p-6 md:p-8 bg-bg-muted border border-border rounded-lg">
      <div className="receipt bg-bg-surface w-full max-w-[400px] border border-border p-7 md:p-8 shadow-sm font-mono text-[14.5px] text-text-primary">
        {/* Store Header */}
        <div className="rh text-center border-b border-dashed border-border-subtle pb-3.5 mb-3">
          <b className="text-lg block font-bold text-text-primary">ARLQ Food Condiments Trading</b>
          <span className="text-text-secondary text-sm">Official Receipt</span>
        </div>

        {/* Receipt Metadata */}
        <div className="rr flex justify-between gap-3 py-1">
          <span className="text-text-secondary">Receipt no.</span>
          <b className="font-bold text-text-primary">{receipt.receipt_number}</b>
        </div>
        <div className="rr flex justify-between gap-3 py-1">
          <span className="text-text-secondary">Date</span>
          <span className="text-text-primary">{receipt.formatted_date}</span>
        </div>
        <div className="rr flex justify-between gap-3 py-1">
          <span className="text-text-secondary">Customer</span>
          <span className="text-right text-text-primary font-medium">{receipt.customer_name}</span>
        </div>

        <hr className="border-0 border-t border-dashed border-border-subtle my-2.5" />

        {/* Itemized Line Items */}
        <div className="space-y-2">
          {receipt.items.map((item) => (
            <div key={item.id} className="it py-1 break-inside-avoid">
              <b className="block font-bold text-text-primary">{item.variant_label}</b>
              <div className="flex justify-between text-text-secondary">
                <span>
                  {item.quantity} × {formatPeso(item.unit_price)}
                </span>
                <span className="text-text-primary font-medium">{formatPeso(item.line_total)}</span>
              </div>
            </div>
          ))}
        </div>

        <hr className="border-0 border-t border-dashed border-border-subtle my-2.5" />

        {/* Financial Summary */}
        <div className="rr tot flex justify-between gap-3 py-1 font-bold text-[16.5px] text-text-primary">
          <span>TOTAL</span>
          <span>{formatPeso(receipt.total_amount)}</span>
        </div>
        <div className="rr flex justify-between gap-3 py-1 text-text-secondary">
          <span>Amount paid</span>
          <span className="text-text-primary">{formatPeso(receipt.amount_paid)}</span>
        </div>
        {receipt.balance > 0 && (
          <div className="rr flex justify-between gap-3 py-1 text-text-primary">
            <span>Remaining balance</span>
            <b className="font-bold text-danger">{formatPeso(receipt.balance)}</b>
          </div>
        )}

        {/* Payment Status Stamp */}
        <div className={`stamp text-center mt-3 font-bold tracking-wider text-[15px] ${stampColorClass}`}>
          {receipt.payment_status}
        </div>

        {/* Footer Note */}
        <div className="rf text-center mt-4 text-[13px] text-text-muted">
          Thank you for your business!
        </div>
      </div>
    </div>
  );
}
