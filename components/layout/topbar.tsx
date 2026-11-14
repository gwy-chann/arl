'use client';

import React from 'react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { NavIcon } from './icons';
import { useLayout } from './layout-context';

export function Topbar() {
  const { toggleSidebar, isSidebarOpen } = useLayout();

  return (
    <header className="topbar w-full flex items-center justify-between h-[52px] px-4 md:px-9 bg-bg-surface border-b border-border sticky top-0 z-30">
      {/* Mobile-only hamburger button and brand logo */}
      <div className="flex items-center gap-3 md:hidden">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Open menu"
          aria-expanded={isSidebarOpen}
          aria-controls="sidebar"
          className="flex items-center justify-center w-9 h-9 rounded-md text-text-secondary hover:bg-bg-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          <NavIcon name="menu" className="w-5 h-5 stroke-[2.2]" />
        </button>

        <div
          role="img"
          aria-label="ARL Quality logo"
          className="topbar-brand logo-mark w-[78px]"
        />
      </div>

      {/* Topbar Right Actions (Theme Toggle) */}
      <div className="topbar-right ml-auto flex items-center gap-2.5">
        <ThemeToggle variant="pill" />
      </div>
    </header>
  );
}
