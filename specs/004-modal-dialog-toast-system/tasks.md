# Implementation Tasks: Reusable Modal Dialog Root, Confirmation Popups & Toast Notifications

**Feature Key**: `ARL-5`  
**Feature Slug**: `004-modal-dialog-toast-system`  

---

## Phase 1: Contracts, Domain Utilities & TDD Unit Tests

- [ ] `T-101`: Create `lib/modal-utils.ts` defining focus trapping query selectors, keyboard focus cycle helpers, body scroll lock counter, and default toast constants.
- [ ] `T-102`: Create `tests/modal-toast.test.ts` covering focus cycling, scroll lock management, confirm resolution states, and toast timing constants.
- [ ] `T-103`: Run `npm test` to verify unit test assertions pass.

---

## Phase 2: Core Modal Dialog Component

- [ ] `T-201`: Create `components/ui/modal.tsx` with React 19 `createPortal` to `#modal-root`, dimmed backdrop overlay (`.modal-back`), click-outside backdrop dismissal, Escape key dismissal, focus trap, body scroll lock, and full WCAG 2.1 AA ARIA attributes (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`).

---

## Phase 3: Confirmation Dialog & Confirmation Context Provider

- [ ] `T-301`: Create `components/ui/confirm-dialog.tsx` implementing structured confirmation dialogs with customizable title, description, cancel button, and confirm button (supporting danger and primary variants).
- [ ] `T-302`: Create `components/ui/confirm-provider.tsx` exposing `useConfirm()` for imperative promise-based confirmations (`const ok = await confirm({ ... })`) and declarative dialog integration.

---

## Phase 4: Toast System Enhancement & Root Portal Integration

- [ ] `T-401`: Update `components/ui/toast-provider.tsx` to mount into `#toasts`, support bottom-right corner stacking with `pointer-events-none` on container and `pointer-events-auto` on toast pills, checkmark SVG icon, and exact 2.8s (`2800ms`) auto-dismissal.
- [ ] `T-402`: Update `app/layout.tsx` to provision `#modal-root` and `#toasts` containers and nest `ConfirmProvider`.

---

## Phase 5: Interactive Verification Showcase & Convergence

- [ ] `T-501`: Enhance `app/(admin)/settings/appearance/page.tsx` with an interactive Modal & Feedback Showcase demonstrating all 4 Jira acceptance scenarios:
  - Destructive delete confirmation with cancel / confirm actions and success toast
  - Modal with backdrop click and Escape key dismissal with focus restoration
  - 2.8-second auto-dismissing toast
  - Concurrent rapid stacked toasts in the bottom-right corner
- [ ] `T-502`: Run `npm test` verifying all test suites pass.
- [ ] `T-503`: Run `npx tsc --noEmit` and `npm run lint` verifying zero type or lint errors.
