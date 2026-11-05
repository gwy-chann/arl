'use client';

import React from 'react';
import Link from 'next/link';

export type InventoryTabKey = 'inventory' | 'in' | 'out' | 'low' | 'history';

interface InventoryTabsProps {
  activeTab: InventoryTabKey;
}

const TABS: { key: InventoryTabKey; label: string; href: string }[] = [
  { key: 'inventory', label: 'Overview', href: '/inventory' },
  { key: 'in', label: 'Stock in', href: '/inventory/in' },
  { key: 'out', label: 'Stock out', href: '/inventory/out' },
  { key: 'low', label: 'Low stock alerts', href: '/inventory/low' },
  { key: 'history', label: 'Movement history', href: '/inventory/history' },
];

export function InventoryTabs({ activeTab }: Readonly<InventoryTabsProps>) {
  return (
    <div
      role="tablist"
      aria-label="Inventory navigation tabs"
      className="tabs flex gap-0.5 border-b border-border mb-5 overflow-x-auto overflow-y-hidden scrollbar-none"
    >
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            role="tab"
            aria-selected={isActive}
            className={`
              px-4 py-2.5 text-[15px] whitespace-nowrap transition-colors duration-150 leading-[1.4] -mb-[1px]
              ${
                isActive
                  ? 'on text-primary border-b-2 border-primary font-semibold'
                  : 'text-text-muted hover:text-text-primary font-medium border-b-2 border-transparent'
              }
            `}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
