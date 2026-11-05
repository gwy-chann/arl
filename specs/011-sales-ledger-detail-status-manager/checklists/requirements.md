# Requirements Quality Checklist: Sales Ledger, Detail View & Status Manager

**Feature Key**: `ARL-15`  
**Feature Slug**: `011-sales-ledger-detail-status-manager`  
**Jira Story**: STORY-3.4: Sales Transaction Ledger, Detail View & Status Manager  

---

## 1. Requirement Completeness & Traceability

- [x] **Jira Acceptance Criteria Coverage**:
  - [x] Scenario 1: Sales ledger search and status filtering (search receipt/customer, filter payment, filter order, click row navigates to `/sales/{id}`).
  - [x] Scenario 2: Overdue sale alert banner (balance > 0, unpaid 9 days with threshold 7 -> "Overdue by 2 days past the reminder limit. Unpaid for 9 days. An SMS reminder was sent...").
  - [x] Scenario 3: Payment status update to fully paid (unpaid ₱1,340 -> Paid, balance 0, banner disappears, toast: "Payment updated: Paid. Reminders stopped.").
  - [x] Scenario 4: Order fulfillment state transition (Pending -> Delivered, order pill updates with informational blue token).

## 2. ARLQ Design System & Token Compliance

- [x] **Zero Hardcoded Colors Rule**:
  - [x] No raw hex colors (e.g. `#1F2933`, `#095B06`, `#E4E4DF`) in components or templates.
  - [x] All surfaces consume `bg-bg-base`, `bg-bg-surface`, `bg-bg-card`, `bg-bg-hover`, `bg-bg-muted`.
  - [x] All text consumes `text-text-primary`, `text-text-secondary`, `text-text-muted`, `text-text-light`.
  - [x] Status pills consume semantic classes:
    - Paid / In stock: `bg-success-light text-success border-success-border`
    - Partially Paid / Pending / Warning: `bg-accent-light text-accent border-accent-border`
    - Not Yet Paid / Overdue / Danger: `bg-danger-light text-danger border-danger-border`
    - Delivered / Picked Up / Info: `bg-info-light text-info border-info-border`
- [x] **Universal Dark Mode Compatibility**:
  - [x] All semantic utility classes resolve CSS variables under `:root` and `.dark` without manual `dark:` hacks.

## 3. UI/UX Consistency with Mockup

- [x] **Ledger Page Layout (`mockup/app.js:438-452`)**:
  - [x] Page header: Title "Sales", Subtitle "All recorded transactions.", Action "+ New sale".
  - [x] Toolbar: Search input, Payment select ("All payments", "Paid", "Partially Paid", "Not Yet Paid"), Order select ("All orders", "Pending", "Delivered", "Picked Up").
  - [x] Table columns: Receipt, Date, Customer, Total, Balance, Payment, Order.
  - [x] Empty state when no records match filter.
- [x] **Detail Page Layout (`mockup/app.js:453-477`)**:
  - [x] Breadcrumbs: `Sales` > `ARLQ-XXXXX`.
  - [x] Subtitle: `Date · Customer Name`.
  - [x] Action button: `Print receipt` (`/receipt/{id}`).
  - [x] Two-column responsive layout (`cols` / `stack` + `aside`).
  - [x] Items section with quantity, unit price, amount, profit, and totals.
  - [x] Customer section with link, phone, address.
  - [x] Payment card with segmented control and partial payment amount input.
  - [x] Order card with segmented control and save button.

## 4. Accessibility (WCAG 2.1 AA)

- [x] Form controls have associated `<label>` or `aria-label`.
- [x] Table markup includes proper `<th>`, `<td>`, and `<thead>`, `<tbody>`, `<tfoot>`.
- [x] Segmented radio controls use keyboard navigation and standard radio semantics.
- [x] Contrast ratio meets 4.5:1 for normal text and 3:1 for large text across light and dark modes.

## 5. Edge Cases & Resilience

- [x] Invalid / missing sale ID displays a user-friendly "Sale not found" message with "Back to sales" button.
- [x] Partial payment amount validation prevents values `<= 0` or `>= total_amount`.
- [x] Non-blocking database calls: fallback to memory state if Supabase connection fails.
