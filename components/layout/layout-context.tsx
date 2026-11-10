'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { usePathname } from 'next/navigation';
import { getInitialExpandedSections } from '@/lib/layout/nav-config';

export interface LayoutContextType {
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  expandedSections: ReadonlySet<string>;
  toggleSection: (key: string) => void;
}

const LayoutContext = createContext<LayoutContextType | null>(null);

export interface LayoutProviderProps {
  children: React.ReactNode;
}

export function LayoutProvider({ children }: Readonly<LayoutProviderProps>) {
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    return new Set(getInitialExpandedSections(pathname || ''));
  });

  // Adjust state during render when pathname changes (official React pattern avoiding useEffect setState cascading render)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsSidebarOpen(false);

    if (pathname) {
      const activeKeys = getInitialExpandedSections(pathname);
      setExpandedSections(new Set(activeKeys));
    }
  }

  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setIsSidebarOpen((prev) => !prev), []);

  const toggleSection = useCallback((key: string) => {
    setExpandedSections((prev) => {
      if (prev.has(key)) {
        return new Set();
      }
      return new Set([key]);
    });
  }, []);

  // Handle Escape key to dismiss mobile drawer
  useEffect(() => {
    if (!isSidebarOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  // Prevent background scrolling while mobile drawer is open
  useEffect(() => {
    if (isSidebarOpen) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isSidebarOpen]);

  const value = useMemo<LayoutContextType>(
    () => ({
      isSidebarOpen,
      openSidebar,
      closeSidebar,
      toggleSidebar,
      expandedSections,
      toggleSection,
    }),
    [isSidebarOpen, openSidebar, closeSidebar, toggleSidebar, expandedSections, toggleSection]
  );

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout(): LayoutContextType {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
