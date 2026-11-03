# Data Model & State Architecture: Modal Dialog Root, Confirmations & Toast Notifications

**Feature Key**: `ARL-5`  
**Feature Slug**: `004-modal-dialog-toast-system`  

---

## 1. Domain Entities & Type Definitions

```typescript
// ==========================================
// Toast Notification Domain
// ==========================================

export type ToastVariant = 'success' | 'danger' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number; // In milliseconds, default 2800ms
  createdAt: number;
}

export interface ToastContextValue {
  showToast: (message: string, duration?: number, variant?: ToastVariant) => void;
  dismissToast: (id: string) => void;
  toasts: ToastItem[];
}

// ==========================================
// Modal Dialog Domain
// ==========================================

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  className?: string;
}

// ==========================================
// Confirmation Dialog Domain
// ==========================================

export type ConfirmVariant = 'danger' | 'primary';

export interface ConfirmOptions {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  resolve?: (confirmed: boolean) => void;
}

export interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  closeConfirm: () => void;
}
```

---

## 2. State Machine: Modal Dialog Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Closed
    Closed --> Opening: Trigger Open (e.g. click "Delete")
    Opening --> Open: Mount Portal to #modal-root & Lock Body Scroll
    Open --> TrappingFocus: Activate Focus Trap & Cache Previous Active Element
    TrappingFocus --> Open: User Interacts With Dialog Controls
    Open --> Closing: Click Backdrop / Press Escape / Click Cancel or Confirm
    Closing --> Closed: Unmount Portal, Unlock Body Scroll & Restore Focus
    Closed --> [*]
```

---

## 3. State Machine: Toast Notification Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> ToastPushed: showToast("Product deleted", 2800)
    ToastPushed --> Displaying: Append to toasts array, mount in #toasts live region
    Displaying --> ConcurrentPush: Multiple rapid system events
    ConcurrentPush --> Displaying: Stack vertically in bottom-right corner
    Displaying --> Dismissing: 2.8s timer fires OR manual dismiss click
    Dismissing --> Displaying: Remove toast item from state
    Displaying --> Idle: All toasts cleared
```
