'use client';

import React from 'react';
import { useTheme } from './use-theme';
import type { ThemePreference } from '@/lib/tokens';

export function ThemePicker() {
  const { theme, setTheme } = useTheme();

  const options: Array<{
    id: ThemePreference;
    title: string;
    description: string;
    icon: React.ReactNode;
    previewClass: string;
  }> = [
    {
      id: 'light',
      title: 'Light mode',
      description: 'Default warm-white store and office layout.',
      previewClass: 'th-preview light',
      icon: (
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
      ),
    },
    {
      id: 'dark',
      title: 'Dark mode',
      description: 'High-contrast obsidian theme for warehouse low light.',
      previewClass: 'th-preview dark',
      icon: (
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
      ),
    },
    {
      id: 'auto',
      title: 'System default',
      description: 'Automatically follows your operating system preference.',
      previewClass: 'th-preview auto',
      icon: (
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
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <fieldset className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-3.5 border-0 p-0 m-0">
      <legend className="sr-only">Choose theme mode preference</legend>
      {options.map((opt) => {
        const isSelected = theme === opt.id;
        return (
          <label
            key={opt.id}
            className={`relative flex flex-col gap-1.5 p-3.5 rounded-xl border-2 cursor-pointer transition-all select-none ${
              isSelected
                ? 'border-primary bg-primary-light shadow-xs'
                : 'border-border hover:border-border-subtle hover:bg-bg-muted bg-bg-surface'
            }`}
          >
            <input
              type="radio"
              name="theme-preference"
              value={opt.id}
              checked={isSelected}
              onChange={() => setTheme(opt.id)}
              className="sr-only"
            />
            <div className={opt.previewClass} aria-hidden="true">
              <div className="th-top" />
              <div className="th-side" />
              <div className="th-content" />
            </div>
            <div className="flex items-center gap-1.5 font-bold text-[15px] text-text-primary">
              {opt.icon}
              <span>{opt.title}</span>
            </div>
            <p className="text-[13px] text-text-muted leading-snug">
              {opt.description}
            </p>
          </label>
        );
      })}
    </fieldset>
  );
}

export default ThemePicker;
