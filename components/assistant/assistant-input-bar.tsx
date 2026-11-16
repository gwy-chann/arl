'use client';

import React, { useRef, useEffect } from 'react';
import { type AssistantStatus } from '@/lib/assistant/assistant-contracts';
import { SendIcon } from './assistant-icons';

export interface AssistantInputBarProps {
  value: string;
  status: AssistantStatus;
  onChange: (val: string) => void;
  onSubmit: () => void;
  autoFocus?: boolean;
}

export function AssistantInputBar({
  value,
  status,
  onChange,
  onSubmit,
  autoFocus = true,
}: Readonly<AssistantInputBarProps>) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && status !== 'loading') {
        onSubmit();
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && status !== 'loading') {
      onSubmit();
    }
  };

  const isSendDisabled = status === 'loading' || !value.trim();

  return (
    <form
      onSubmit={handleFormSubmit}
      className="p-3 border-t border-border bg-bg-surface flex items-center gap-2 select-none"
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask a question..."
        disabled={status === 'loading'}
        aria-label="Ask a question to Store Assistant"
        className="flex-1 bg-bg-input border border-border rounded-lg px-3.5 py-2 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-hidden focus:border-border-focus transition-colors disabled:opacity-50"
      />

      <button
        type="submit"
        disabled={isSendDisabled}
        className="inline-flex items-center justify-center p-2 rounded-lg bg-primary hover:bg-primary-hover text-text-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        aria-label="Send message"
        title="Send"
      >
        <SendIcon className="w-4 h-4 text-text-light" />
      </button>
    </form>
  );
}
