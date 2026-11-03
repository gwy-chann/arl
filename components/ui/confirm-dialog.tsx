'use client';

import React from 'react';
import { Modal } from './modal';
import type { ConfirmVariant } from '@/specs/004-modal-dialog-toast-system/contracts/modal-toast-contracts';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: Readonly<ConfirmDialogProps>) {
  const confirmButtonClass =
    variant === 'danger'
      ? 'bg-danger hover:bg-danger/90 text-text-light font-medium rounded-[var(--r)] px-4 py-2 text-[14.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger'
      : 'bg-primary hover:bg-primary-hover text-text-light font-medium rounded-[var(--r)] px-4 py-2 text-[14.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="bg-secondary hover:bg-secondary-hover text-text-primary border border-border rounded-[var(--r)] px-4 py-2 text-[14.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={confirmButtonClass}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      }
    >
      <div className="py-1">
        {typeof message === 'string' ? (
          <p className="text-text-muted m-0 text-[15px] leading-relaxed">
            {message}
          </p>
        ) : (
          message
        )}
      </div>
    </Modal>
  );
}
