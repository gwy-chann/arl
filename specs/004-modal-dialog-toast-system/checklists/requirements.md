# Requirements Quality Checklist: Modal Dialog Root, Confirmations & Toast Notifications

**Feature Key**: `ARL-5`  
**Feature Slug**: `004-modal-dialog-toast-system`  

---

## 1. Requirement Completeness & Parity

- [x] **Portal Roots**: Both `#modal-root` and `#toasts` containers exist in the root layout DOM tree.
- [x] **Modal Dialog Component**: Reusable `Modal` component supports arbitrary child content with header, body, and footer layout slots.
- [x] **Confirm Dialog Component**: `ConfirmDialog` provides structured confirmation popups with affirmative or destructive variants.
- [x] **Programmatic Confirm Hook**: `useConfirm` allows async confirmation (`const ok = await confirm({ ... })`).
- [x] **Toast Provider & Hook**: `ToastProvider` and `useToast` support queueing and stacking multiple notifications.
- [x] **Exact Mockup Timeout**: Default auto-dismiss timeout is exactly 2.8s (`2800ms`), matching `mockup/app.js:183`.
- [x] **Non-Blocking Container**: `#toasts` container uses `pointer-events-none` with `pointer-events-auto` on toast items.

---

## 2. Accessibility & Usability (WCAG 2.1 AA)

- [x] **Focus Trapping**: Keyboard focus is locked inside the active modal dialog while open.
- [x] **Focus Restoration**: Focus returns to the triggering button or active element when modal closes.
- [x] **Escape Key**: Pressing `Escape` cleanly dismisses the active modal dialog.
- [x] **Backdrop Click**: Clicking outside the dialog card on the dimmed overlay dismisses the modal.
- [x] **ARIA Roles**:
  - Modal container: `role="dialog"` and `aria-modal="true"`.
  - Accessible names: `aria-labelledby` referencing modal title; `aria-describedby` referencing body message.
  - Toast notifications: `role="status"` and `aria-live="polite"`.
- [x] **Scroll Lock**: `document.body.style.overflow = 'hidden'` applied while modal is open, restored on close.

---

## 3. Design Tokens & Visual Hierarchy

- [x] **Zero Hardcoded Colors**: All components use semantic Tailwind classes (`bg-bg-surface`, `border-border`, `text-text-primary`, `text-text-muted`, `bg-danger`, `bg-primary`, etc.).
- [x] **Light Mode Styling**: Warm off-white backdrop with clean white elevated surface (`#FFFFFF`) and border `#E4E4DF`.
- [x] **Dark Mode Styling**: Deep dark background overlay (`rgba(0,0,0,0.75)`), surface `#1F2937`, border `#374151`, and white text `#FFFFFF`.
- [x] **Interactive States**: Buttons have clear focus rings (`focus-visible:ring-2 focus-visible:ring-primary`) and hover states.

---

## 4. Testability & Verification

- [x] **Unit Tests**: Test modal open/close states, focus management, confirmation resolver, and toast timeout/queueing logic.
- [x] **Browser Verification**: Dedicated interactive test trigger section on the Settings Appearance page to demonstrate all 4 Jira scenarios.
