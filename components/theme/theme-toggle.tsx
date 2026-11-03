'use client';

import React from 'react';
import { useTheme } from './use-theme';

export interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', showLabel = true }: Readonly<ThemeToggleProps>) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`inline-flex items-center gap-1.75 px-3.25 py-1.5 rounded-full border border-border-subtle bg-bg-muted hover:bg-bg-surface text-text-primary hover:text-primary hover:border-primary text-[13.5px] font-semibold cursor-pointer transition-all shadow-xs ${className}`}
    >
      {isDark ? (
        <>
          <svg
            className="w-4 h-4 text-primary shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          {showLabel && <span>Light mode</span>}
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4 text-primary shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
          {showLabel && <span>Dark mode</span>}
        </>
      )}
    </button>
  );
}

export default ThemeToggle;

