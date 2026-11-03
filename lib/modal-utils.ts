/**
 * Modal & Toast Domain Utilities
 * Feature: ARL-5 (004-modal-dialog-toast-system)
 */

import { useSyncExternalStore } from 'react';

export const DEFAULT_TOAST_DURATION = 2800; // Exactly 2.8s matching mockup/app.js:183

export const FOCUSABLE_ELEMENTS_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Idiomatic React 19 hook to detect client-side mounting without triggering cascading render lint errors.
 */
const emptySubscribe = () => () => {};
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

/**
 * Calculates the next index in a circular focus loop.
 */
export function getNextFocusedIndex(
  currentIndex: number,
  totalElements: number,
  isShiftTab: boolean
): number {
  if (totalElements <= 0) return -1;
  if (isShiftTab) {
    return currentIndex <= 0 ? totalElements - 1 : currentIndex - 1;
  }
  return currentIndex >= totalElements - 1 ? 0 : currentIndex + 1;
}

/**
 * Filter and return currently visible and interactable focusable elements inside a container.
 */
export function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  const rawElements = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS_SELECTOR)
  );
  return rawElements.filter((el) => {
    return (
      el.offsetWidth > 0 ||
      el.offsetHeight > 0 ||
      el.getClientRects().length > 0 ||
      el.tabIndex >= 0
    );
  });
}

let activeModalCount = 0;
let previousBodyOverflow = '';

/**
 * Locks document body scrolling when a modal opens, and restores it when all modals unmount.
 * Safe for SSR and Node.js testing environments.
 */
export function lockBodyScroll(): () => void {
  if (typeof document !== 'undefined' && activeModalCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  activeModalCount += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeModalCount = Math.max(0, activeModalCount - 1);
    if (typeof document !== 'undefined' && activeModalCount === 0) {
      document.body.style.overflow = previousBodyOverflow;
    }
  };
}

export function getActiveModalCount(): number {
  return activeModalCount;
}

export function resetActiveModalCount(): void {
  activeModalCount = 0;
  if (typeof document !== 'undefined') {
    document.body.style.overflow = previousBodyOverflow;
  }
}
