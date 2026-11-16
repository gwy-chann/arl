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
      <div className="side-logo shrink-0">
        <div
          role="img"
          aria-label="ARL Quality logo"
          className="logo-mark"
        />
        <span>
          Food Condiments Trading
          <br />
          Inventory and Sales
        </span>
      </div>

      {/* Main Navigation */}
      <nav className="nav overflow-y-auto" aria-label="Main">
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
                className={sectionActive ? 'on' : ''}
              >
                <NavIcon name={item.icon} className="w-4.5 h-4.5 shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span className="badge-n">
                    {item.badgeCount}
                  </span>
                )}
              </Link>

              {/* Nested Subnav Accordion */}
              {hasSubNav && isExpanded && (
                <div className="subnav">
                  {item.subNav!.map((sub) => {
                    const subActive = isRouteActive(pathname, sub.href, true);
                    return (
                      <Link
                        key={sub.key}
                        href={sub.href}
                        onClick={closeSidebar}
                        className={subActive ? 'on' : ''}
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
      <div className="sidebar-foot shrink-0">
        <div className="who">
          <div className="avatar">
            {userInitials}
          </div>
          <div className="min-w-0">
            <b>{userName}</b>
            <span>{userRole}</span>
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
