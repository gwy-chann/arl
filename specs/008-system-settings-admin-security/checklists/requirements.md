# Requirements Quality Checklist: System Settings & Admin Security

**Feature Key**: `ARL-21`  
**Feature Slug**: `008-system-settings-admin-security`  
**Created**: 2026-11-05  
**Feature**: [spec.md](../spec.md)

---

## 1. Content Quality & Clarity

- [x] **No implementation details in requirements**: Focused on user and business needs.
- [x] **Clear Persona & Value**: Explicit story for ARLQ store administrator to configure store parameters and safeguard access.
- [x] **Zero Ambiguity**: Defaults, limits, and validation boundaries defined.

---

## 2. Requirement Completeness & Acceptance Criteria Coverage

- [x] **Scenario 1 - Reminder threshold update**:
  - Threshold modifies (e.g. from 7 to 5 days).
  - Persists to database.
  - Sales older than threshold classify as "Overdue".
  - Toast confirmation: "Reminder settings saved".
- [x] **Scenario 2 - Batch minimum stock thresholds**:
  - 3x3 minimum stock matrix on `/settings/stock`.
  - Batch updates all 9 product variants in a single transaction.
  - Inventory low stock calculations immediately reflect new thresholds.
  - Toast confirmation: "Minimum stock levels saved".
- [x] **Scenario 3 - Password validation**:
  - Blocks submission when $< 8$ characters or passwords mismatch.
  - Displays error toast: "New passwords do not match".
  - Network request is prevented.
- [x] **Scenario 4 - Successful password update**:
  - Validates current password and matching new password ($\ge 8$ chars).
  - Supabase Auth updates credentials.
  - Displays toast: "Password updated".

---

## 3. Design System & Accessibility (WCAG 2.1 AA)

- [x] **Zero Hardcoded Colors**: Adheres strictly to semantic tokens (`bg-bg-surface`, `border-border`, `text-text-primary`, `bg-primary`, etc.).
- [x] **Accessible Forms & Matrix**:
  - Labels linked to inputs via `htmlFor` / `id`.
  - Descriptive `aria-label` for matrix table inputs (e.g., `Toyo 1L minimum stock`).
  - Visible focus rings (`focus:border-border-focus`).
- [x] **Tab Navigation**:
  - Tab bar with accessible `role="tablist"` or standard nav links with `aria-current="page"`.
  - Mobile scrollable without breaking horizontal overflow.
