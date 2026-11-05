'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const SETTINGS_TABS = [
  { href: '/settings/reminders', label: 'Reminder settings' },
  { href: '/settings/stock', label: 'Minimum stock levels' },
  { href: '/settings/appearance', label: 'Appearance' },
  { href: '/settings/password', label: 'Change password' },
] as const;

export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <div
      role="tablist"
      aria-label="Settings sections"
      className="flex gap-0.5 border-b border-border mb-6 overflow-x-auto overflow-y-hidden scrollbar-none"
    >
      {SETTINGS_TABS.map((tab) => {
        const isActive = pathname === tab.href;
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
