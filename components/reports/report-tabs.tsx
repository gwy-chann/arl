'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const REPORT_TABS = [
  { href: '/reports/sales', label: 'Sales' },
  { href: '/reports/inventory', label: 'Inventory' },
  { href: '/reports/movement', label: 'Stock movement' },
  { href: '/reports/low', label: 'Low stock' },
  { href: '/reports/balances', label: 'Customer balances' },
  { href: '/reports/profit', label: 'Earnings and profit' },
] as const;

export function ReportTabs() {
  const pathname = usePathname();

  return (
    <div
      role="tablist"
      aria-label="Report tabs"
      className="flex gap-0.5 border-b border-border mb-6 overflow-x-auto overflow-y-hidden scrollbar-none no-print"
    >
      {REPORT_TABS.map((tab) => {
        const isActive = pathname === tab.href || (pathname === '/reports' && tab.href === '/reports/sales');
        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={isActive}
            className={`px-4 py-2.5 text-[15px] whitespace-nowrap transition-colors border-b-2 -mb-px leading-[1.4] cursor-pointer ${
              isActive
                ? 'text-primary border-primary font-semibold'
                : 'text-text-muted hover:text-text-primary border-transparent font-medium'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
