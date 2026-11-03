# Implementation Plan: Reusable Modal Dialog Root, Confirmation Popups & Toast Notifications

**Feature Key**: `ARL-5`  
**Feature Slug**: `004-modal-dialog-toast-system`  

---

## 1. Component Hierarchy & Architectural Boundaries

```text
app/layout.tsx
├── #modal-root (DOM Portal Anchor for all modals)
├── #toasts (DOM Portal Anchor for toast stack)
└── ToastProvider (Context & Toast State Management)
    └── ConfirmProvider (Global Declarative & Imperative Confirmation Context)
        └── ThemeProvider
            └── AppShell (Authenticated administrative layout)
                └── Page Content (e.g. Dashboard, Categories, Products, Settings)
```

---

## 2. Component Deliverables & Responsibilities

| File Path | Role & Purpose |
| :--- | :--- |
| `app/layout.tsx` | Ensure `#modal-root` and `#toasts` containers exist in body. Nest `ConfirmProvider` alongside `ToastProvider`. |
| `components/ui/modal.tsx` | Reusable modal dialog with backdrop overlay, focus trap, Escape key listener, scroll lock, and `createPortal` mounting. |
| `components/ui/confirm-dialog.tsx` | Structured confirmation popup supporting destructive ("Delete") and informational prompts. |
| `components/ui/confirm-provider.tsx` | Context provider exposing `useConfirm()` for async confirmation workflows (`const ok = await confirm({ ... })`). |
| `components/ui/toast-provider.tsx` | Enhance existing toast system: mount into `#toasts`, support bottom-right stacking, checkmark icon, and exact 2800ms auto-dismissal. |
| `lib/modal-utils.ts` | Utilities for managing focus trap, finding focusable elements, and scroll lock counters. |
| `tests/modal-toast.test.ts` | Automated unit test suite verifying modal state, focus helpers, confirmation resolver, and toast timeouts. |
| `app/(admin)/settings/appearance/page.tsx` | Interactive showcase section allowing testing and verification of all 4 acceptance scenarios. |

---

## 3. Design Tokens & Styling Mapping

All components strictly adhere to SWIFT design tokens (`lib/tokens.ts`, `app/globals.css`):

- **Backdrop**: `fixed inset-0 bg-[#141613]/45 dark:bg-black/75 z-50 flex items-center justify-center p-4 animate-fade`
- **Modal Surface**: `bg-bg-surface border border-border text-text-primary rounded-[10px] shadow-2xl w-full max-w-[460px] animate-pop`
- **Modal Title**: `text-[18px] font-semibold text-text-primary px-5.5 pt-5`
- **Modal Body**: `px-5.5 py-3.5 text-[15px] text-text-secondary leading-relaxed`
- **Modal Footer**: `flex justify-end gap-2.5 px-5.5 pb-5 pt-4`
- **Buttons**:
  - Cancel / Secondary: `bg-secondary hover:bg-secondary-hover text-text-primary border border-border rounded-[var(--r)] px-4 py-2 text-[14.5px] font-medium`
  - Destructive / Danger: `bg-danger hover:bg-danger/90 text-text-light rounded-[var(--r)] px-4 py-2 text-[14.5px] font-medium shadow-sm`
  - Primary: `bg-primary hover:bg-primary-hover text-text-light rounded-[var(--r)] px-4 py-2 text-[14.5px] font-medium shadow-sm`
- **Toast Pill**:
  - Container: `#toasts` fixed at `bottom-5 right-6 flex flex-col gap-2 z-90 items-end pointer-events-none`
  - Pill: `pointer-events-auto bg-text-primary text-text-light dark:bg-bg-surface dark:text-text-primary dark:border dark:border-border px-4.5 py-2.5 rounded-[var(--r)] text-[14.5px] font-semibold shadow-lg animate-pop flex items-center gap-2.5`
  - Success Icon: Green checkmark SVG in `text-success`

---

## 4. Test Strategy

1. **Unit Tests (`tests/modal-toast.test.ts`)**:
   - `DEFAULT_TOAST_DURATION` constant check (`2800ms`).
   - Focus trap logic and keyboard navigation loop.
   - Confirm state management and promise resolution (true on confirm, false on cancel).
   - Toast queueing, stacking, and dismissal timing.
2. **End-to-End & Browser Checks**:
   - Verification via Interactive Demo on Settings Appearance page.
   - Typecheck (`npx tsc --noEmit`) and ESLint (`npm run lint`).
