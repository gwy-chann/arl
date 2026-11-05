/**
 * Navigation Configuration and Route Matcher Utilities
 * Source of truth: mockup/app.js (NAV array)
 */

export type NavIconName =
  | 'home'
  | 'cart'
  | 'box'
  | 'tag'
  | 'users'
  | 'chart'
  | 'gear'
  | 'out'
  | 'menu'
  | 'search'
  | 'sun'
  | 'moon';

export interface SubNavItem {
  readonly label: string;
  readonly href: string;
  readonly key: string;
}

export interface NavItem {
  readonly key: string;
  readonly label: string;
  readonly icon: NavIconName;
  readonly href: string;
  readonly badgeCount?: number;
  readonly subNav?: readonly SubNavItem[];
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'home',
    href: '/dashboard',
  },
  {
    key: 'sales',
    label: 'Sales',
    icon: 'cart',
    href: '/sales',
    subNav: [
      { label: 'New sale', href: '/sales/new', key: 'sales/new' },
      { label: 'Sales list', href: '/sales', key: 'sales' },
    ],
  },
  {
    key: 'inventory',
    label: 'Inventory',
    icon: 'box',
    href: '/inventory',
    subNav: [
      { label: 'Stock overview', href: '/inventory', key: 'inventory' },
      { label: 'Stock in', href: '/inventory/in', key: 'inventory/in' },
      { label: 'Stock out', href: '/inventory/out', key: 'inventory/out' },
      { label: 'Low stock alerts', href: '/inventory/low', key: 'inventory/low' },
      { label: 'Movement history', href: '/inventory/history', key: 'inventory/history' },
    ],
  },
  {
    key: 'products',
    label: 'Products',
    icon: 'tag',
    href: '/products',
    subNav: [
      { label: 'Product list', href: '/products', key: 'products' },
      { label: 'Categories', href: '/products/categories', key: 'products/categories' },
    ],
  },
  {
    key: 'customers',
    label: 'Customers',
    icon: 'users',
    href: '/customers',
    subNav: [
      { label: 'Customer list', href: '/customers', key: 'customers' },
      { label: 'Customers with balances', href: '/customers/balances', key: 'customers/balances' },
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    icon: 'chart',
    href: '/reports',
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: 'gear',
    href: '/settings/reminders',
    subNav: [
      { label: 'Reminder settings', href: '/settings/reminders', key: 'settings/reminders' },
      { label: 'Minimum stock levels', href: '/settings/stock', key: 'settings/stock' },
      { label: 'Appearance', href: '/settings/appearance', key: 'settings/appearance' },
      { label: 'Change password', href: '/settings/password', key: 'settings/password' },
    ],
  },
] as const;

/**
 * Checks if a target href is active for the current pathname.
 */
export function isRouteActive(
  currentPath: string,
  targetHref: string,
  exact = false
): boolean {
  if (!currentPath || !targetHref) return false;
  // Normalize trailing slashes
  const cleanCurrent = currentPath.length > 1 && currentPath.endsWith('/')
    ? currentPath.slice(0, -1)
    : currentPath;
  const cleanTarget = targetHref.length > 1 && targetHref.endsWith('/')
    ? targetHref.slice(0, -1)
    : targetHref;

  if (exact || cleanTarget === '/dashboard') {
    return cleanCurrent === cleanTarget;
  }

  return cleanCurrent === cleanTarget || cleanCurrent.startsWith(`${cleanTarget}/`);
}

/**
 * Determines whether a main nav item or any of its subnav items matches the current route.
 */
export function isSectionActive(currentPath: string, item: NavItem): boolean {
  if (isRouteActive(currentPath, item.href)) {
    return true;
  }
  if (item.subNav) {
    return item.subNav.some((sub) => isRouteActive(currentPath, sub.href, true));
  }
  return false;
}

/**
 * Finds all sections that should be expanded by default based on current route.
 */
export function getInitialExpandedSections(currentPath: string): string[] {
  const activeKeys: string[] = [];
  for (const item of NAV_ITEMS) {
    if (item.subNav && isSectionActive(currentPath, item)) {
      activeKeys.push(item.key);
    }
  }
  return activeKeys;
}

/**
 * Generates user initials for avatar display.
 * Default is 'AD' matching mockup Administrator / Owner account.
 */
export function getInitials(nameOrEmail?: string | null): string {
  if (!nameOrEmail) return 'AD';
  const clean = nameOrEmail.trim();
  if (clean.toLowerCase() === 'administrator') return 'AD';

  const parts = clean.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length === 0) return 'AD';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
