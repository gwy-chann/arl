'use client';

import React from 'react';
import { LayoutProvider } from './layout-context';
import { Sidebar, type SidebarProps } from './sidebar';
import { Topbar } from './topbar';
import { Scrim } from './scrim';

export interface AppShellProps {
  children: React.ReactNode;
  user?: SidebarProps['user'];
}

export function AppShell({ children, user }: Readonly<AppShellProps>) {
  return (
    <LayoutProvider>
      <div className="min-h-screen bg-bg-base text-text-primary flex flex-col md:flex-row">
        <Sidebar user={user} />
        <Scrim />
        <div className="flex-1 min-w-0 flex flex-col">
          <Topbar />
          <main id="page" className="flex-1 p-6 md:p-10">
            {children}
          </main>
        </div>
      </div>
    </LayoutProvider>
  );
}

