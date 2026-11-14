'use client';

import React from 'react';
import { useTheme } from './use-theme';

export interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'pill' | 'button';
}

export function ThemeToggle({
  className = '',
  showLabel = true,
  variant = 'pill',
}: Readonly<ThemeToggleProps>) {
  const { isDark, toggleTheme } = useTheme();

  const baseClass = variant === 'button' ? 'btn sec sm' : 'theme-toggle-btn';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`${baseClass} ${className}`}
    >
      {isDark ? (
        <>
          <svg
            className="w-4 h-4 shrink-0 stroke-[2]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
          {showLabel && <span>Light mode</span>}
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4 shrink-0 stroke-[1.8]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
          {showLabel && <span>Dark mode</span>}
        </>
      )}
    </button>
  );
}

export default ThemeToggle;
