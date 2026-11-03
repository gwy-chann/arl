import type {
  ThemePreference,
  ResolvedTheme,
} from '../tokens.ts';
import {
  THEME_STORAGE_KEY,
  isValidThemePreference,
  resolveEffectiveTheme,
} from '../tokens.ts';

export { THEME_STORAGE_KEY, isValidThemePreference, resolveEffectiveTheme };
export type { ThemePreference, ResolvedTheme };

export interface ThemeState {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
}

export interface ThemeContextValue extends ThemeState {
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
}

/**
 * Returns the corresponding affirmative toast message for a given theme change.
 */
export function getToastMessageForTheme(theme: ThemePreference): string {
  if (theme === 'auto') {
    return 'Theme set to System default';
  }
  return theme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled';
}

/**
 * Toggles to the opposite visual mode.
 * When in light (or auto resolving to light), returns 'dark'.
 * When in dark (or auto resolving to dark), returns 'light'.
 */
export function getToggledTheme(isCurrentlyDark: boolean): ThemePreference {
  return isCurrentlyDark ? 'light' : 'dark';
}
