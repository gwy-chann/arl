'use client';

import React from 'react';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { NavIcon } from './icons';
import { useLayout } from './layout-context';

export function Topbar() {
  const { toggleSidebar, isSidebarOpen } = useLayout();

  return (
    <header
      className="sticky top-0 z-30 h-[52px] w-full flex items-center justify-between px-4 md:px-9 bg-bg-surface border-b border-border"
    >
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

        <div className="w-[78px] flex items-center">
          <Image
            src="/logo.png"
            alt="ARL Quality Logo"
            width={78}
            height={32}
            className="w-full h-auto object-contain"
          />
        </div>
      </div>

      {/* Topbar Right Actions (Theme Toggle) */}
      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
      </div>
    </header>
  );
}

