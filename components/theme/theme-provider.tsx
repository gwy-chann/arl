'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from 'react';
import type {
  ThemePreference,
  ResolvedTheme,
} from '@/lib/tokens';
import {
  THEME_STORAGE_KEY,
  isValidThemePreference,
  resolveEffectiveTheme,
} from '@/lib/tokens';
import {
  getToastMessageForTheme,
  getToggledTheme,
  ThemeContextValue,
} from '@/lib/theme/theme-utils';
import { useToast } from '@/components/ui/toast-provider';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyThemeToDocument(resolved: ResolvedTheme, explicitTheme: ThemePreference) {
  if (typeof document === 'undefined') return;

  if (resolved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
  }

  document.documentElement.dataset.themePreference = explicitTheme;
}

// Subscription & snapshots for stored theme preference
function subscribeTheme(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getThemeSnapshot(): ThemePreference {
  if (typeof window === 'undefined') return 'auto';
  try {
    const val = localStorage.getItem(THEME_STORAGE_KEY);
    return isValidThemePreference(val) ? val : 'auto';
  } catch {
    return 'auto';
  }
}

function getServerThemeSnapshot(): ThemePreference {
  return 'auto';
}

// Subscription & snapshots for system media query
function subscribeSystemDark(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

function getSystemDarkSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getServerSystemDarkSnapshot(): boolean {
  return false;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);
  const systemDark = useSyncExternalStore(
    subscribeSystemDark,
    getSystemDarkSnapshot,
    getServerSystemDarkSnapshot
  );

  const { showToast } = useToast();

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    return resolveEffectiveTheme(theme, systemDark);
  }, [theme, systemDark]);

  const isDark = resolvedTheme === 'dark';

  // Synchronize document attributes with reactive theme state
  useEffect(() => {
    applyThemeToDocument(resolvedTheme, theme);
  }, [resolvedTheme, theme]);

  const setTheme = useCallback(
    (newTheme: ThemePreference) => {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      } catch {
        // Handle localStorage quota or sandbox restriction
      }

      // Trigger immediate affirmative feedback toast
      showToast(getToastMessageForTheme(newTheme));

      // Immediately notify subscribers in current and other windows
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }
    },
    [showToast]
  );

  const toggleTheme = useCallback(() => {
    const nextTheme = getToggledTheme(isDark);
    setTheme(nextTheme);
  }, [isDark, setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      isDark,
      setTheme,
      toggleTheme,
    }),
    [theme, resolvedTheme, isDark, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
