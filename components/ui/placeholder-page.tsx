import React from 'react';
import Link from 'next/link';
import { NavIcon } from '@/components/layout/icons';
import type { NavIconName } from '@/lib/layout/nav-config';

export interface PlannedFeatureItem {
  title: string;
  description: string;
}

export interface RelatedLinkItem {
  label: string;
  href: string;
  description?: string;
  badge?: string;
}

export interface PlaceholderPageProps {
  title: string;
  subtitle?: string;
  icon?: NavIconName;
  moduleKey?: string;
  plannedFeatures?: PlannedFeatureItem[];
  relatedLinks?: RelatedLinkItem[];
  bannerNote?: string;
}

export function PlaceholderPage({
  title,
  subtitle = 'This module is scheduled for implementation in an upcoming sprint.',
  icon = 'box',
  plannedFeatures = [],
  relatedLinks = [],
  bannerNote,
}: Readonly<PlaceholderPageProps>) {
  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-text-muted">
        <Link href="/dashboard" className="hover:text-primary transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-text-primary font-medium">{title}</span>
      </nav>

      {/* Main Header / Under Construction Card */}
      <div className="bg-bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <NavIcon name={icon} className="w-7 h-7 stroke-[1.8]" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
                {title}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Under Construction
              </span>
            </div>
            <p className="text-sm sm:text-base text-text-muted leading-relaxed">
              {subtitle}
            </p>
          </div>
        </div>

        {bannerNote && (
          <div className="mt-6 p-4 rounded-lg bg-bg-muted border border-border text-sm text-text-secondary flex items-start gap-3">
            <span className="text-base select-none">💡</span>
            <div>{bannerNote}</div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-border flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-text-light bg-primary hover:bg-primary-hover rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            ← Return to Dashboard
          </Link>
          {relatedLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/15 border border-primary/25 rounded-lg transition-colors cursor-pointer"
            >
              <span>{link.label}</span>
              {link.badge && (
                <span className="text-[11px] font-bold px-1.5 py-0.2 bg-primary text-text-light rounded-sm">
                  {link.badge}
                </span>
              )}
              <span>→</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Planned Capabilities */}
      {plannedFeatures.length > 0 && (
        <div className="bg-bg-surface border border-border rounded-xl p-6 shadow-xs">
          <h2 className="text-base font-bold text-text-primary mb-3 flex items-center gap-2">
            <span>📋 Planned Capabilities</span>
          </h2>
          <p className="text-xs text-text-muted mb-4">
            Here is a preview of the functionality planned for this module in ARLQ Food Condiments Trading:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {plannedFeatures.map((feat) => (
              <div
                key={feat.title}
                className="p-3.5 rounded-lg border border-border bg-bg-muted/40 hover:bg-bg-muted/70 transition-colors"
              >
                <div className="text-sm font-semibold text-text-primary mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-text-muted" />
                  {feat.title}
                </div>
                <div className="text-xs text-text-muted leading-relaxed">
                  {feat.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Navigation Help */}
      <div className="bg-bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-text-primary">Need something else?</h3>
          <p className="text-xs text-text-muted mt-0.5">
            Jump to an active section of the inventory and sales management system.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/products/categories"
            className="text-xs font-semibold text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-md border border-border hover:bg-bg-muted transition-colors"
          >
            Product Categories
          </Link>
          <Link
            href="/settings/appearance"
            className="text-xs font-semibold text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-md border border-border hover:bg-bg-muted transition-colors"
          >
            Appearance Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
