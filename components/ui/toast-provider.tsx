'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { createPortal } from 'react-dom';
import { DEFAULT_TOAST_DURATION } from '@/lib/modal-utils';
import type {
  ToastItem,
  ToastVariant,
  ToastContextValue,
} from '@/specs/004-modal-dialog-toast-system/contracts/modal-toast-contracts';

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({
  children,
  portalTargetId = 'toasts',
}: Readonly<{
  children: React.ReactNode;
  portalTargetId?: string;
}>) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, duration = DEFAULT_TOAST_DURATION, variant: ToastVariant = 'success') => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastItem = {
        id,
        message,
        duration,
        variant,
        createdAt: Date.now(),
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const value = useMemo(
    () => ({ showToast, dismissToast, toasts }),
    [showToast, dismissToast, toasts]
  );

  const toastContainer = (
    <div
      id="toast-stack-container"
      className="fixed bottom-5.5 right-6 flex flex-col gap-2 z-90 items-end pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
      data-testid="toast-container"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="pointer-events-auto bg-text-primary text-text-light dark:bg-bg-surface dark:text-text-primary dark:border dark:border-border px-4.5 py-2.5 rounded-[var(--r)] text-[14.5px] font-semibold shadow-lg animate-pop flex items-center gap-2.5"
          data-testid="toast-item"
        >
          {toast.variant === 'danger' ? (
            <svg
              className="w-4 h-4 text-danger shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 text-success shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );

  const portalTarget =
    mounted && typeof document !== 'undefined'
      ? document.getElementById(portalTargetId) || document.body
      : null;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {portalTarget ? createPortal(toastContainer, portalTarget) : null}
    </ToastContext.Provider>
  );
}
