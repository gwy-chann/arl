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
    <div className="page-head">
      <div>
        <h1>Good day, {adminName}</h1>
        <p>{displayDate}</p>
      </div>

      <div className="actions">
        <Link href="/sales/new" className="btn">
          <svg
            className="w-4 h-4 stroke-current shrink-0"
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

        <Link href="/inventory/in" className="btn sec">
          <svg
            className="w-4 h-4 stroke-current shrink-0"
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
