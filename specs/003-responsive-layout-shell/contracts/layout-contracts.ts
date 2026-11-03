/**
 * Component and Route Contracts for Responsive Layout Shell (ARL-3)
 */

export interface SubNavItemContract {
  label: string;
  href: string;
  key: string;
}

export interface NavItemContract {
  key: string;
  label: string;
  icon: 'home' | 'cart' | 'box' | 'tag' | 'users' | 'chart' | 'gear';
  href: string;
  badgeCount?: number;
  subNav?: readonly SubNavItemContract[];
}

export interface UserProfileContract {
  name: string;
  role: string;
  email?: string;
  initials: string;
}

export interface LayoutStateContract {
  isSidebarOpen: boolean;
  expandedSections: string[];
}

export interface AppShellPropsContract {
  children: React.ReactNode;
  user?: UserProfileContract;
}

export interface SidebarPropsContract {
  currentPathname: string;
  user?: UserProfileContract;
  isOpen: boolean;
  onClose: () => void;
  expandedSections: ReadonlySet<string>;
  onToggleSection: (key: string) => void;
}

export interface TopbarPropsContract {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}
