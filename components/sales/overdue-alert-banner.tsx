import React from 'react';

export interface OverdueAlertBannerProps {
  daysOverdue: number;
  daysUnpaid: number;
  adminMobile: string;
  className?: string;
}

export function OverdueAlertBanner({
  daysOverdue,
  daysUnpaid,
  adminMobile,
  className = '',
}: Readonly<OverdueAlertBannerProps>) {
  const dayUnit = daysOverdue === 1 ? 'day' : 'days';

  return (
    <div
      role="alert"
      className={`notice card bg-danger-light border border-danger-border flex items-start gap-3.5 p-4 rounded-xl shadow-xs ${className}`}
    >
      <span className="dot bad w-2.5 h-2.5 rounded-full bg-danger mt-1.5 shrink-0" aria-hidden="true" />
      <p className="flex-1 text-[15px] text-text-primary leading-snug">
        <b className="font-semibold text-text-primary block">
          Overdue by {daysOverdue} {dayUnit} past the reminder limit.
        </b>
        <small className="block text-[13.5px] text-text-secondary mt-0.5">
          Unpaid for {daysUnpaid} days. An SMS reminder was sent to {adminMobile}. It stops when you mark this sale as Paid.
        </small>
      </p>
    </div>
  );
}
