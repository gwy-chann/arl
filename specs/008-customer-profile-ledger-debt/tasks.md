# Tasks: Customer Profile View with Purchase Ledger & Debt Breakdown

**Feature Key**: `ARL-10`  
**Feature Slug**: `008-customer-profile-ledger-debt`  
**Status**: In Progress  

---

## Phase 1: Domain Contracts & Service Calculation Logic

- [ ] `T-1.1`: Extend `SaleSummary` in `lib/customers/customer-contracts.ts` with optional `days_outstanding?: number` and `is_overdue?: boolean`.
- [ ] `T-1.2`: Implement `getDaysOutstanding` and `isSaleOverdue` utilities in `lib/customers/customer-service.ts`.
- [ ] `T-1.3`: Enrich seeded sales data in `lib/customers/customer-service.ts` so `k2` (Mang Tonyo Carinderia) has 5 past transactions (3 Paid, 2 with unpaid balances including the ₱240.00 overdue sale) satisfying both Scenario 1 and Scenario 2.

---

## Phase 2: UI Components & Route Integration

- [ ] `T-2.1`: Update `components/customers/customer-profile.tsx`:
  - Format balance card header to show `₱0.00` with `text-text-primary` when fully paid.
  - Itemize unpaid sales with days outstanding, link to `/sales/[id]`, and "Overdue" pill when days $\ge 7$.
  - Ensure table rows and receipt numbers link to `/sales/[id]`.
  - Maintain strict adherence to design tokens (zero hardcoded colors).
- [ ] `T-2.2`: Update `app/(admin)/sales/new/page.tsx` and its customer selector to support `customerId` search parameter pre-selection satisfying Scenario 3.

---

## Phase 3: Automated Verification & Unit Tests

- [ ] `T-3.1`: Create `tests/customer-profile.test.ts` implementing tests for all 4 Gherkin scenarios:
  - Scenario 1: Mang Tonyo profile with ₱240 debt, contact line, and overdue pill.
  - Scenario 2: Customer with 5 past transactions chronologically listed with receipt, date, total, balance, payment pill, order pill.
  - Scenario 3: Pre-selected customer trigger for `/sales/new`.
  - Scenario 4: Fully settled customer account with `₱0.00` and "Fully paid. Nothing is owed."
- [ ] `T-3.2`: Run test suite via `node --test --experimental-strip-types tests/customer-profile.test.ts`.

---

## Phase 4: Convergence & Verification

- [ ] `T-4.1`: Run `npm run typecheck` and `npm run lint`.
- [ ] `T-4.2`: Run full test suite `npm test`.
- [ ] `T-4.3`: Stage and commit with atomic conventional commits referencing `[ARL-10]`.
- [ ] `T-4.4`: Push branch and open Pull Request.
