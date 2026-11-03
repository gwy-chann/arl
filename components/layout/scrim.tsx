'use client';

import React from 'react';
import { useLayout } from './layout-context';

export function Scrim() {
  const { isSidebarOpen, closeSidebar } = useLayout();

  if (!isSidebarOpen) {
    return null;
  }

  return (
    <div
      id="scrim"
      role="presentation"
      aria-hidden="true"
      onClick={closeSidebar}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] md:hidden transition-opacity duration-200"
    />
  );
}

