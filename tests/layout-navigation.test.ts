import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  NAV_ITEMS,
  isRouteActive,
  isSectionActive,
  getInitialExpandedSections,
  getInitials,
} from '../lib/layout/nav-config.ts';

describe('Responsive Layout Navigation & Shell Models (ARL-3)', () => {
  describe('NAV_ITEMS configuration integrity', () => {
    test('contains all 7 core administrative modules matching mockup and scope', () => {
      const keys = NAV_ITEMS.map((item) => item.key);
      assert.deepStrictEqual(keys, [
        'dashboard',
        'sales',
        'inventory',
        'products',
        'customers',
        'reports',
        'settings',
      ]);
    });

    test('validates subnavigation items for expandable modules', () => {
      const sales = NAV_ITEMS.find((n) => n.key === 'sales');
      assert.ok(sales?.subNav);
      assert.strictEqual(sales.subNav.length, 2);
      assert.deepStrictEqual(
        sales.subNav.map((s) => s.label),
        ['New sale', 'Sales list']
      );

      const inventory = NAV_ITEMS.find((n) => n.key === 'inventory');
      assert.ok(inventory?.subNav);
      assert.strictEqual(inventory.subNav.length, 5);
      assert.deepStrictEqual(
        inventory.subNav.map((s) => s.label),
        ['Stock overview', 'Stock in', 'Stock out', 'Low stock alerts', 'Movement history']
      );

      const products = NAV_ITEMS.find((n) => n.key === 'products');
      assert.ok(products?.subNav);
      assert.strictEqual(products.subNav.length, 2);

      const customers = NAV_ITEMS.find((n) => n.key === 'customers');
      assert.ok(customers?.subNav);
      assert.strictEqual(customers.subNav.length, 2);

      const settings = NAV_ITEMS.find((n) => n.key === 'settings');
      assert.strictEqual(settings?.subNav, undefined);
    });
  });

  describe('isRouteActive route matching logic', () => {
    test('accurately identifies dashboard as exact match', () => {
      assert.strictEqual(isRouteActive('/dashboard', '/dashboard'), true);
      assert.strictEqual(isRouteActive('/dashboard/', '/dashboard'), true);
      assert.strictEqual(isRouteActive('/dashboard/analytics', '/dashboard'), false);
      assert.strictEqual(isRouteActive('/sales', '/dashboard'), false);
    });

    test('supports nested module path matching', () => {
      assert.strictEqual(isRouteActive('/sales', '/sales'), true);
      assert.strictEqual(isRouteActive('/sales/new', '/sales'), true);
      assert.strictEqual(isRouteActive('/inventory/in', '/inventory'), true);
      assert.strictEqual(isRouteActive('/sales-extra', '/sales'), false);
    });

    test('respects exact match flag when requested', () => {
      assert.strictEqual(isRouteActive('/sales/new', '/sales', true), false);
      assert.strictEqual(isRouteActive('/sales/new', '/sales/new', true), true);
    });

    test('handles empty or malformed route inputs safely', () => {
      assert.strictEqual(isRouteActive('', '/sales'), false);
      assert.strictEqual(isRouteActive('/sales', ''), false);
    });
  });

  describe('isSectionActive module section resolution', () => {
    test('returns true for direct and subnav route hits', () => {
      const salesItem = NAV_ITEMS.find((n) => n.key === 'sales')!;
      assert.strictEqual(isSectionActive('/sales', salesItem), true);
      assert.strictEqual(isSectionActive('/sales/new', salesItem), true);
      assert.strictEqual(isSectionActive('/inventory', salesItem), false);

      const settingsItem = NAV_ITEMS.find((n) => n.key === 'settings')!;
      assert.strictEqual(isSectionActive('/settings', settingsItem), true);
      assert.strictEqual(isSectionActive('/settings/reminders', settingsItem), true);
      assert.strictEqual(isSectionActive('/settings/stock', settingsItem), true);
      assert.strictEqual(isSectionActive('/settings/appearance', settingsItem), true);
      assert.strictEqual(isSectionActive('/settings/password', settingsItem), true);
    });
  });

  describe('getInitialExpandedSections determination', () => {
    test('resolves active section for subnav accordion expansion', () => {
      assert.deepStrictEqual(getInitialExpandedSections('/dashboard'), []);
      assert.deepStrictEqual(getInitialExpandedSections('/sales'), ['sales']);
      assert.deepStrictEqual(getInitialExpandedSections('/sales/new'), ['sales']);
      assert.deepStrictEqual(getInitialExpandedSections('/inventory/history'), ['inventory']);
    });
  });

  describe('getInitials avatar formatting', () => {
    test('formats initials matching ARLQ mockup standards', () => {
      assert.strictEqual(getInitials('Administrator'), 'AD');
      assert.strictEqual(getInitials(''), 'AD');
      assert.strictEqual(getInitials(null), 'AD');
      assert.strictEqual(getInitials(undefined), 'AD');
      assert.strictEqual(getInitials('Roselle Tabuena'), 'RT');
      assert.strictEqual(getInitials('admin@arlq.com'), 'AA');
    });
  });
});
