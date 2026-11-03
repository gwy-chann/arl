# Feature Specification: Reusable Modal Dialog Root, Confirmation Popups & Toast Notifications

**Feature Key**: `ARL-5`  
**Feature Slug**: `004-modal-dialog-toast-system`  
**Jira Story**: STORY-1.4: Reusable Modal Dialog Root, Confirmation Popups & Toast Notifications  
**Epic**: EPIC-1: Foundation, Authentication Hub & App Shell (`ARL-1`)  
**Status**: Ready for Planning  

---

## 1. User Story

**As an** ARLQ store administrator,  
**I want to** interact with accessible modal dialogs, destructive action confirmations, and auto-dismissing toasts,  
**so that** I receive clear operational feedback and am safeguarded against accidental data loss.

---

## 2. Business Invariants & Rules

1. **Dedicated Portal Roots**:
   - Modal dialogs mount exclusively into `#modal-root`, ensuring top-level DOM positioning outside parent clipping contexts or z-index stacking boundaries.
   - Toast notifications mount exclusively into `#toasts`, maintaining an unobtrusive stacked overlay on administrative pages.
2. **Accessible Dialog Lifecycle (WCAG 2.1 AA)**:
   - When a modal opens, keyboard focus is automatically trapped within the modal container. Initial focus targets the first interactive element or specified auto-focus target.
   - Body scroll is locked while any modal is mounted to prevent background scroll drift.
   - Dismissal triggers:
     - Pressing the `Escape` key immediately closes the active modal dialog.
     - Clicking the semi-transparent backdrop overlay (`.modal-back`) outside the modal card closes the dialog.
     - Explicit "Cancel" or "Close" button clicks close the dialog.
   - Upon dismissal, focus is automatically restored to the triggering element (or previously focused active element).
   - ARIA semantics: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and `aria-describedby` must be maintained.
3. **Destructive & Operational Confirmation Modals**:
   - `ConfirmDialog` / `useConfirm` provides declarative and programmatic confirmation dialogs for destructive actions (e.g. Delete Product, Delete Category).
   - "Cancel" closes the dialog with zero mutations, leaving the application state completely untouched.
   - "Confirm" (e.g., "Delete category", "Delete product") executes the action and triggers affirmative feedback (e.g. success toast).
4. **Toast Notification System**:
   - Multiple toast triggers stack cleanly without layout collisions in the bottom-right corner (or configured screen position), with `pointer-events-none` on the container and `pointer-events-auto` on individual toast pills so underlying page controls remain interactive.
   - Each toast displays an affirmative checkmark icon (or status icon), accompanied by concise confirmation copy (e.g., "Category saved", "Product added", "Category deleted").
   - By default, toasts auto-dismiss after exactly 2.8 seconds (`2800ms`), mirroring the reference mockup (`mockup/app.js:183`).
   - Accessible announcement: Rendered within an `aria-live="polite"` and `role="status"` live region.
5. **Strict Semantic Design Token Adherence**:
   - Zero hardcoded hex colors or arbitrary values.
   - Light theme: surface `var(--bg-surface)` (`#FFFFFF`), border `var(--border)` (`#E4E4DF`), text `var(--text-primary)` (`#1F2933`), muted text `var(--text-muted)` (`#6B7280`), backdrop `rgba(20, 22, 19, 0.45)`.
   - Dark theme: surface `var(--bg-surface)` (`#1F2937`), border `var(--border)` (`#374151`), text `var(--text-primary)` (`#FFFFFF`), backdrop `rgba(0, 0, 0, 0.75)`.
   - Danger button: `bg-danger hover:bg-danger/90 text-text-light font-medium rounded-[var(--r)] px-4 py-2`.

---

## 3. Gherkin Acceptance Criteria

### Scenario 1: Destructive action confirmation dialog
```gherkin
Feature: Destructive Confirmation Modal
  Scenario: Admin confirms deletion of an item
    Given an admin initiates a delete action on a product or category
    When the confirmation modal appears
    Then focus is trapped within the dialog
    And clicking "Cancel" closes the modal with zero mutations
    When clicking "Delete", the action executes and displays a success toast
```

### Scenario 2: Modal backdrop and escape key dismissal
```gherkin
Feature: Modal Dismissal and Focus Restoration
  Scenario: Dismissing modal via Escape or backdrop
    Given any modal dialog open on screen
    When the user presses the Escape key or clicks on the dimmed backdrop overlay
    Then the modal closes cleanly and focus returns to the triggering button
```

### Scenario 3: Toast notification auto-dismissal
```gherkin
Feature: Toast Notification Auto-Dismissal
  Scenario: Displaying affirmative toast message
    Given a successful user action (e.g. "Category saved")
    When the toast notification appears in "#toasts"
    Then it renders a checkmark icon with affirmative copy
    And automatically disappears after exactly 2.8 seconds
```

### Scenario 4: Non-blocking stacked notifications
```gherkin
Feature: Concurrent Stacked Toast Notifications
  Scenario: Multiple toasts triggered in rapid succession
    Given multiple rapid system events
    When multiple toasts trigger concurrently
    Then they stack cleanly in the bottom-right corner without obscuring interactive controls
    And older toasts dismiss individually based on their timer without disrupting the stack
```

---

## 4. UI Specification (Source of Truth: `mockup/`)

### 4.1. Modal Dialog Structure
- **Backdrop (`.modal-back`)**: `position: fixed; inset: 0; background: rgba(20, 22, 19, 0.45); display: grid; place-items: center; padding: 20px; z-index: 50;` (in dark mode: `rgba(0, 0, 0, 0.75)`).
- **Dialog Container (`.modal`)**: `background: var(--bg-surface); border-radius: 10px; width: 100%; max-width: 460px; box-shadow: 0 20px 50px rgba(0,0,0,.25); border: 1px solid var(--border);`.
- **Header (`.modal h3`)**: `font-size: 18px; font-weight: 650; padding: 20px 22px 0; color: var(--text-primary);`.
- **Body (`.modal .mb`)**: `padding: 14px 22px 6px; font-size: 15px; color: var(--text-secondary);`.
- **Footer (`.modal .mf`)**: `display: flex; justify-content: flex-end; gap: 9px; padding: 16px 22px 20px;`.

### 4.2. Toast Notification Pill
- **Container (`#toasts` / `.toasts`)**: `position: fixed; bottom: 22px; right: 24px; display: flex; flex-direction: column; gap: 8px; z-index: 90; pointer-events: none; align-items: flex-end;`.
- **Pill (`.toast`)**: `pointer-events: auto; background: var(--text-primary); color: #fff; padding: 11px 18px; border-radius: var(--r); font-size: 15px; font-weight: 550; box-shadow: 0 8px 24px rgba(0,0,0,.25); display: flex; gap: 10px; align-items: center;`.
  - In dark mode: `background: #1F2937; color: #FFFFFF; border: 1px solid #4B5563; box-shadow: 0 12px 30px rgba(0,0,0,.6);`.
  - Checkmark icon: SVG icon in `--success` color.
