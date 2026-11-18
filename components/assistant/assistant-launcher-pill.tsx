'use client';

import React from 'react';
import { LAUNCHER_LABEL } from '@/lib/assistant/assistant-contracts';
import { CatIcon } from './assistant-icons';

export interface AssistantLauncherPillProps {
  onClick: () => void;
}

export function AssistantLauncherPill({ onClick }: Readonly<AssistantLauncherPillProps>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={false}
      aria-haspopup="dialog"
      aria-label="Open Store Assistant"
      title={LAUNCHER_LABEL}
      suppressHydrationWarning
      className="group fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary text-text-light border-2 border-primary-border shadow-lg hover:shadow-xl hover:bg-primary-hover hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer select-none focus:outline-hidden focus:border-border-focus"
    >
      {/* Online ready status indicator */}
      <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 flex h-3.5 w-3.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-success border-2 border-bg-surface" />
      </span>

      {/* Cat Icon */}
      <CatIcon className="w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-200 group-hover:scale-110" />

      {/* Floating Tooltip Label (visible on hover) */}
      <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-md bg-bg-surface px-2.5 py-1 text-xs font-medium text-text-primary border border-border shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {LAUNCHER_LABEL}
      </span>
    </button>
  );
}
