'use client';

import React from 'react';
import { LAUNCHER_LABEL } from '@/lib/assistant/assistant-contracts';
import { MessageSquareIcon } from './assistant-icons';

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
      className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-bg-surface text-text-primary border border-border shadow-md hover:bg-bg-hover hover:border-border-subtle transition-all duration-200 cursor-pointer select-none text-xs sm:text-sm font-medium focus:outline-hidden focus:border-border-focus"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
      </span>

      <MessageSquareIcon className="w-4 h-4 text-text-secondary" />

      <span className="tracking-tight">{LAUNCHER_LABEL}</span>
    </button>
  );
}
