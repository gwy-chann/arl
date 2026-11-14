'use client';

import React, { useState, useTransition } from 'react';
import { useToast } from '@/components/ui/toast-provider';
import { sendCustomerSmsReminderAction } from '@/lib/sales/sale-actions';

export interface OverdueAlertBannerProps {
  daysOverdue: number;
  daysUnpaid: number;
  adminMobile: string;
  saleId?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  lastSmsSentAt?: string | null;
  className?: string;
}

export function OverdueAlertBanner({
  daysOverdue,
  daysUnpaid,
  adminMobile,
  saleId,
  customerId,
  customerName = 'Customer',
  customerPhone,
  lastSmsSentAt: initialLastSmsSentAt,
  className = '',
}: Readonly<OverdueAlertBannerProps>) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [lastSentAt, setLastSentAt] = useState<string | null | undefined>(initialLastSmsSentAt);
  const [isCooldown, setIsCooldown] = useState(false);

  const dayUnit = daysOverdue === 1 ? 'day' : 'days';

  const formatLastSent = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return null;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      });
    } catch {
      return null;
    }
  };

  const formattedLastSent = formatLastSent(lastSentAt);

  const handleSendCustomerSms = () => {
    if (!customerPhone || !customerPhone.trim()) {
      showToast('Cannot send SMS: No customer phone number recorded', undefined, 'danger');
      return;
    }

    startTransition(async () => {
      const res = await sendCustomerSmsReminderAction({
        saleId,
        customerId,
      });

      if (!res.success) {
        showToast(res.error || 'Failed to dispatch SMS reminder', undefined, 'danger');
        return;
      }

      const now = new Date().toISOString();
      setLastSentAt(now);
      setIsCooldown(true);
      showToast(`SMS reminder sent to ${customerName}`);
    });
  };

  const hasPhone = Boolean(customerPhone && customerPhone.trim());

  return (
    <div
      role="alert"
      className={`notice card bg-danger-light border border-danger-border flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 rounded-xl shadow-xs ${className}`}
    >
      <div className="flex items-start gap-3.5 flex-1">
        <span
          className="dot bad w-2.5 h-2.5 rounded-full bg-danger mt-1.5 shrink-0"
          aria-hidden="true"
        />
        <div className="text-[15px] text-text-primary leading-snug">
          <b className="font-semibold text-text-primary block">
            Overdue by {daysOverdue} {dayUnit} past the reminder limit.
          </b>
          <small className="block text-[13.5px] text-text-secondary mt-0.5">
            Unpaid for {daysUnpaid} days. An SMS reminder was sent to {adminMobile}. It stops when you mark this sale as Paid.
          </small>
          {formattedLastSent && (
            <small className="block text-xs text-text-muted mt-1 font-medium">
              Last customer SMS sent: {formattedLastSent}
            </small>
          )}
        </div>
      </div>

      {(saleId || customerId) && (
        <div className="shrink-0 flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={handleSendCustomerSms}
            disabled={isPending || isCooldown || !hasPhone}
            className="btn sec sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-bg-surface hover:bg-bg-hover text-text-primary transition-colors"
            title={
              !hasPhone
                ? 'No customer mobile number on record'
                : isCooldown
                ? 'Reminder dispatched recently'
                : 'Send SMS to Customer'
            }
          >
            {isPending ? 'Sending...' : isCooldown ? 'Sent to Customer' : 'Send SMS to Customer'}
          </button>
        </div>
      )}
    </div>
  );
}
