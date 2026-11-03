import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidThemePreference,
  resolveEffectiveTheme,
  THEME_STORAGE_KEY,
  getThemeTokens,
  LIGHT_THEME_TOKENS,
  DARK_THEME_TOKENS,
} from '../lib/tokens.ts';
import {
  getToastMessageForTheme,
  getToggledTheme,
} from '../lib/theme/theme-utils.ts';

describe('Theme Design Token System & Resolver (ARL-4)', () => {
  test('constants and storage key integrity', () => {
    assert.strictEqual(THEME_STORAGE_KEY, 'arlq-theme');
  });

  test('isValidThemePreference validates allowed preferences', () => {
    assert.strictEqual(isValidThemePreference('light'), true);
    assert.strictEqual(isValidThemePreference('dark'), true);
    assert.strictEqual(isValidThemePreference('auto'), true);

    assert.strictEqual(isValidThemePreference('dim'), false);
    assert.strictEqual(isValidThemePreference(''), false);
    assert.strictEqual(isValidThemePreference(null), false);
    assert.strictEqual(isValidThemePreference(undefined), false);
    assert.strictEqual(isValidThemePreference(123), false);
  });

  describe('resolveEffectiveTheme behavior', () => {
    test('explicit "dark" preference always resolves to "dark"', () => {
      assert.strictEqual(resolveEffectiveTheme('dark', false), 'dark');
      assert.strictEqual(resolveEffectiveTheme('dark', true), 'dark');
    });

    test('explicit "light" preference always resolves to "light"', () => {
      assert.strictEqual(resolveEffectiveTheme('light', false), 'light');
      assert.strictEqual(resolveEffectiveTheme('light', true), 'light');
    });

    test('"auto" preference dynamically matches OS system preference', () => {
      // System prefers dark -> resolves to dark
      assert.strictEqual(resolveEffectiveTheme('auto', true), 'dark');
      // System prefers light -> resolves to light
      assert.strictEqual(resolveEffectiveTheme('auto', false), 'light');
    });
  });

  describe('Toast notification messaging', () => {
    test('provides exact affirmative messages conforming to mockup', () => {
      assert.strictEqual(getToastMessageForTheme('dark'), 'Dark mode enabled');
      assert.strictEqual(getToastMessageForTheme('light'), 'Light mode enabled');
      assert.strictEqual(getToastMessageForTheme('auto'), 'Theme set to System default');
    });
  });

  describe('Toggle cycling logic', () => {
    test('correctly inverts current visual mode', () => {
      assert.strictEqual(getToggledTheme(true), 'light');
      assert.strictEqual(getToggledTheme(false), 'dark');
    });
  });

  describe('Token mapping consistency', () => {
    test('returns exact light theme tokens', () => {
      const tokens = getThemeTokens('light');
      assert.strictEqual(tokens.surfaces.base, LIGHT_THEME_TOKENS.surfaces.base);
      assert.strictEqual(tokens.brand.primary, '#095B06');
    });

    test('returns exact dark theme tokens', () => {
      const tokens = getThemeTokens('dark');
      assert.strictEqual(tokens.surfaces.base, DARK_THEME_TOKENS.surfaces.base);
      assert.strictEqual(tokens.brand.primary, '#22C55E');
    });
  });
});
