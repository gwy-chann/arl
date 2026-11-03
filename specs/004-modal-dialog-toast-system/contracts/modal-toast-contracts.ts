/**
 * Component and API Contracts: Modal Dialog Root, Confirmations & Toast Notifications
 * Feature: ARL-5 (004-modal-dialog-toast-system)
 */

export type ToastVariant = 'success' | 'danger' | 'info' | 'warning';
export type ConfirmVariant = 'danger' | 'primary';
export type ModalMaxWidth = 'sm' | 'md' | 'lg' | 'xl';

export interface ToastItem {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  createdAt: number;
}

export interface ToastContextValue {
  showToast: (message: string, duration?: number, variant?: ToastVariant) => void;
  dismissToast: (id: string) => void;
  toasts: ToastItem[];
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: ModalMaxWidth;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  className?: string;
  portalTargetId?: string;
}

export interface ConfirmOptions {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  closeConfirm: () => void;
}

export const DEFAULT_TOAST_DURATION = 2800; // Exactly 2.8 seconds matching mockup/app.js:183

export const MODAL_WIDTH_CLASSES: Record<ModalMaxWidth, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};
