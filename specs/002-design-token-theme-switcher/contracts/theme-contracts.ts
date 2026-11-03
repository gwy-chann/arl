/**
 * Theme & Token System Validation Contracts
 * Feature: ARL-4 Design Token System & Dynamic Theme Switcher
 */

export const THEME_STORAGE_KEY = 'arlq-theme';

export type ThemePreference = 'light' | 'dark' | 'auto';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeState {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
}

export interface ThemeContextValue extends ThemeState {
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
}

export function isValidThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'auto';
}

export function resolveEffectiveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean
): ResolvedTheme {
  if (preference === 'dark') return 'dark';
  if (preference === 'light') return 'light';
  return systemPrefersDark ? 'dark' : 'light';
}
