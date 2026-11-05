import React from 'react';
import Link from 'next/link';

export interface DashboardHeaderProps {
  dateString?: string;
  adminName?: string;
}

export function DashboardHeader({
  dateString,
  adminName = 'Admin',
}: Readonly<DashboardHeaderProps>) {
  const displayDate =
    dateString ||
    new Date().toLocaleDateString('en-PH', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-border">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary">
          Good day, {adminName}
        </h1>
        <p className="text-sm text-text-muted mt-1">{displayDate}</p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/sales/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-primary text-text-light hover:bg-primary-hover active:scale-98 transition-all shadow-xs"
        >
          <svg
            className="w-4 h-4 stroke-current"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New sale
        </Link>

        <Link
          href="/inventory/in"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-bg-surface text-text-primary border border-border hover:bg-bg-hover active:scale-98 transition-all shadow-xs"
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
            <path d="M21 8l-9-5-9 5 9 5 9-5z" />
            <path d="M3 8v8l9 5 9-5V8" />
            <path d="M12 13v8" />
          </svg>
          Stock in
        </Link>
      </div>
    </div>
  );
}
