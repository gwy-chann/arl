# Implementation Tasks: Executive Dashboard (ARL-18)

**Feature Key**: `ARL-18`  
**Feature Slug**: `013-executive-dashboard`  
**Jira Story**: STORY-4.1: Executive Dashboard with KPI Cards, Sales Chart & Urgent Notices  

---

## Phase 1: Contracts & Service Layer

- [ ] **Task 1.1**: Create `lib/dashboard/dashboard-contracts.ts` (re-export contracts, DTO types, and currency/capacity helpers).
- [ ] **Task 1.2**: Implement `DashboardService` in `lib/dashboard/dashboard-service.ts`:
  - Calculate `sales_today`, `transactions_today`, `sales_this_month`, `profit_this_month`.
  - Calculate `outstanding_balances` and `unpaid_sales_count`.
  - Compute 7-day rolling buckets with proportional height percentages and today flag.
  - Compute 3×3 product variant matrix with capacity progress meters.
  - Collate urgent notices (overdue utang + low stock) sorted by urgency.
  - Aggregate top 5 customer debts with overdue status.

---

## Phase 2: Automated Acceptance Test Suite (TDD)

- [ ] **Task 2.1**: Implement `tests/dashboard.test.ts`:
  - Scenario 1: Executive KPI computation (₱1,240 across 3 sales, 2 low stock variants, outstanding balances).
  - Scenario 2: 7-day sales visualizer chart calculation (proportional bar heights, today highlight, currency format).
  - Scenario 3: Stock on hand matrix (3x3 grid for Toyo, Suka, Patis across sizes with capacity percentages and low stock flags).
  - Scenario 4: Urgent notice stream generation (overdue debt notice with `/sales/{id}` action and low stock notice with `/inventory/in` action).
  - Scenario 5: Who owes you debtor aggregation (top 5 debtors sorted descending with overdue pill).
  - Scenario 6: Clear and empty state resilience.

---

## Phase 3: Presentation Components (`components/dashboard/`)

- [ ] **Task 3.1**: Create `components/dashboard/dashboard-header.tsx`:
  - Date salutation "Good day, Admin" with formatted current date.
  - Action buttons: `+ New sale` (`/sales/new`) and `Stock in` (`/inventory/in`).
- [ ] **Task 3.2**: Create `components/dashboard/dashboard-kpi-cards.tsx`:
  - 4-card metric grid matching `.stats` and `.stat` from mockup.
  - Alert warning tokens applied to cards when low stock or debt balances exist.
- [ ] **Task 3.3**: Create `components/dashboard/dashboard-sales-chart.tsx`:
  - Pure CSS 7-day bar chart with active today accent styling (`.bar.cur`).
  - Monetary values displayed in `<em>` elements and day labels.
  - Link to `/reports`.
- [ ] **Task 3.4**: Create `components/dashboard/dashboard-stock-matrix.tsx`:
  - 3×3 matrix table showing products and sizes.
  - Inline progress meters with low stock warning styling.
  - Link to `/inventory`.
- [ ] **Task 3.5**: Create `components/dashboard/dashboard-urgent-notices.tsx`:
  - Prioritized notification stream with dot badges (`.dot.bad`, `.dot.warn`).
  - Action buttons deeplinking to `/sales/{id}` and `/inventory/in`.
  - "All clear" empty state.
- [ ] **Task 3.6**: Create `components/dashboard/dashboard-debt-ranking.tsx`:
  - Top 5 debtor customer rows with oldest unpaid days and overdue badge.
  - Link to `/customers` or `/customers/balances`.
  - "No balances" empty state.

---

## Phase 4: Route Integration & Global Styles

- [ ] **Task 4.1**: Enhance `app/globals.css` with semantic dashboard utility classes (`.stats`, `.stat`, `.dash-grid`, `.bars`, `.bar`, `.stockgrid`, `.meter`, `.notice`) adhering strictly to CSS variable tokens.
- [ ] **Task 4.2**: Update `app/(admin)/dashboard/page.tsx`:
  - Replace static session placeholder with `DashboardService.getDashboardData()`.
  - Compose header, KPI cards, sales chart, stock matrix, urgent notices, and debt ranking.

---

## Phase 5: Verification & Convergence

- [ ] **Task 5.1**: Run `npm test` inside `.worktrees/ARL-18` to ensure all tests pass.
- [ ] **Task 5.2**: Run `npm run build` or `npm run lint` to guarantee zero type errors.
- [ ] **Task 5.3**: Check token compliance and accessibility (zero hardcoded hex colors).
