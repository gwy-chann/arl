'use client';

import React from 'react';
import { LAUNCHER_LABEL, type AssistantStatus } from '@/lib/assistant/assistant-contracts';
import { ClearIcon, MinimizeIcon, CatIcon } from './assistant-icons';

export interface AssistantHeaderProps {
  status: AssistantStatus;
  messageCount: number;
  onClear: () => void;
  onMinimize: () => void;
}

export function AssistantHeader({
  status,
  messageCount,
  onClear,
  onMinimize,
}: Readonly<AssistantHeaderProps>) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-surface select-none">
      <div className="flex items-center gap-2.5">
        <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-primary-light text-primary border border-primary-border/30 shrink-0">
          <CatIcon className="w-4 h-4" />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
            {status === 'loading' ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary tracking-tight">
            {LAUNCHER_LABEL}
          </span>
          <span className="text-xs text-text-muted">
            {status === 'loading' ? 'Processing...' : 'Ready'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {messageCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-text-muted hover:text-text-primary hover:bg-bg-hover border border-border-subtle transition-colors cursor-pointer"
            aria-label="Clear chat history"
            title="Clear conversation"
          >
            <ClearIcon className="w-3 h-3 text-text-muted" />
            <span>Clear</span>
          </button>
        )}

        <button
          type="button"
          onClick={onMinimize}
          className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
          aria-label="Minimize Store Assistant"
          title="Minimize"
        >
          <MinimizeIcon className="w-4 h-4 text-text-secondary" />
        </button>
      </div>
    </div>
  );
}
