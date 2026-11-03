'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { ConfirmDialog } from './confirm-dialog';
import type {
  ConfirmOptions,
  ConfirmContextValue,
} from '@/specs/004-modal-dialog-toast-system/contracts/modal-toast-contracts';

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
}

export function ConfirmProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    setIsLoading(false);

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const closeConfirm = useCallback(() => {
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
    setIsOpen(false);
    setIsLoading(false);
    options?.onCancel?.();
  }, [options]);

  const handleConfirm = useCallback(async () => {
    try {
      setIsLoading(true);
      if (options?.onConfirm) {
        await options.onConfirm();
      }
      if (resolverRef.current) {
        resolverRef.current(true);
        resolverRef.current = null;
      }
      setIsOpen(false);
    } catch {
      // Keep modal open or handle failure
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const value = useMemo(
    () => ({
      confirm,
      closeConfirm,
    }),
    [confirm, closeConfirm]
  );

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {options && (
        <ConfirmDialog
          isOpen={isOpen}
          title={options.title}
          message={options.message}
          confirmLabel={options.confirmLabel}
          cancelLabel={options.cancelLabel}
          variant={options.variant}
          isLoading={isLoading}
          onConfirm={handleConfirm}
          onCancel={closeConfirm}
        />
      )}
    </ConfirmContext.Provider>
  );
}
