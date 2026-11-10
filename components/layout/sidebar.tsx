'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  NAV_ITEMS,
  isRouteActive,
  isSectionActive,
  getInitials,
} from '@/lib/layout/nav-config';
import { NavIcon } from './icons';
import { useLayout } from './layout-context';
import { logoutAction } from '@/app/login/actions';

export interface SidebarProps {
  user?: {
    name?: string;
    role?: string;
    email?: string;
  };
}

export function Sidebar({ user }: Readonly<SidebarProps>) {
  const pathname = usePathname() || '';
  const { isSidebarOpen, closeSidebar, expandedSections, toggleSection } = useLayout();

  const userName = user?.name || 'Administrator';
  const userRole = user?.role || 'Owner account';
  const userInitials = getInitials(user?.name || user?.email || 'Administrator');

  return (
    <aside
      id="sidebar"
      aria-label="Sidebar navigation"
      className={`
        fixed inset-y-0 left-0 z-60 w-70 md:w-65
        flex flex-col bg-bg-surface border-r border-border
        md:sticky md:top-0 md:h-screen md:z-10
        transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl md:shadow-none' : '-translate-x-full md:translate-x-0'}
      `}
    >
      {/* Brand Header */}
      <div className="flex flex-col items-center justify-center pt-4 pb-3.5 px-6 gap-1.5 bg-primary dark:bg-linear-to-b dark:from-hero-gradient-from dark:to-hero-gradient-to dark:border-b dark:border-border text-text-light shrink-0">
        <div
          role="img"
          aria-label="ARL Quality logo"
          className="logo-mark w-full max-w-38.75 mx-auto"
        />
        <span className="text-[12.5px] text-text-light/85 dark:text-text-secondary text-center leading-[1.3] font-medium">
          Food Condiments Trading
          <br />
          Inventory and Sales
        </span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 flex flex-col gap-0.5" aria-label="Main">
        {NAV_ITEMS.map((item) => {
          const sectionActive = isSectionActive(pathname, item);
          const isExpanded = expandedSections.has(item.key);
          const hasSubNav = Boolean(item.subNav && item.subNav.length > 0);

          return (
            <div key={item.key} className="flex flex-col">
              <Link
                href={item.href}
                onClick={(e) => {
                  if (hasSubNav) {
                    if (isExpanded) {
                      e.preventDefault();
                      toggleSection(item.key);
                    } else {
                      toggleSection(item.key);
                    }
                  } else {
                    closeSidebar();
                  }
                }}
                aria-expanded={hasSubNav ? isExpanded : undefined}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-md
                  text-[14.5px] transition-colors cursor-pointer
                  ${
                    sectionActive
                      ? 'bg-primary-light text-primary font-semibold dark:bg-[rgba(34,197,94,0.22)] dark:text-primary-hover dark:font-bold'
                      : 'text-text-secondary hover:bg-bg-muted hover:text-text-primary font-medium'
                  }
                `}
              >
                <NavIcon name={item.icon} className="w-4.5 h-4.5 shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span className="ml-auto bg-danger text-text-light text-[11.5px] font-bold rounded-full px-2 py-0.5 leading-none">
                    {item.badgeCount}
                  </span>
                )}
              </Link>

              {/* Nested Subnav Accordion */}
              {hasSubNav && isExpanded && (
                <div className="flex flex-col ml-8 border-l border-border my-1 pl-1">
                  {item.subNav!.map((sub) => {
                    const subActive = isRouteActive(pathname, sub.href, true);
                    return (
                      <Link
                        key={sub.key}
                        href={sub.href}
                        onClick={closeSidebar}
                        className={`
                          py-1.5 px-3 rounded-r-md text-[13.5px] transition-colors
                          ${
                            subActive
                              ? 'text-primary font-bold dark:text-primary-hover'
                              : 'text-text-muted hover:text-text-primary font-medium'
                          }
                        `}
                      >
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="border-t border-border p-2.5 shrink-0 flex flex-col gap-2">
        <div className="flex items-center gap-2.5 px-2 py-1">
          <div className="w-8 h-8 rounded-full bg-bg-muted border border-border flex items-center justify-center font-bold text-xs text-text-primary shrink-0">
            {userInitials}
          </div>
          <div className="min-w-0">
            <b className="block text-sm font-semibold text-text-primary truncate">
              {userName}
            </b>
            <span className="block text-[12.5px] text-text-muted truncate">
              {userRole}
            </span>
          </div>
        </div>

        <form action={logoutAction} className="w-full">
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[14.5px] font-medium text-text-secondary hover:bg-bg-muted hover:text-text-primary transition-colors cursor-pointer text-left"
          >
            <NavIcon name="out" className="w-4.5 h-4.5 text-danger shrink-0" />
            <span>Log out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
