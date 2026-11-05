# Tasks: Customer Utang (Credit Balance) Tracker & Overdue Reminder Queue

**Feature Key**: `ARL-19`  
**Feature Slug**: `014-customer-utang-tracker-reminder-queue`  
**Status**: Ready for Implementation  

---

## Phase 1: Domain Contracts & Service Calculation Logic

- [ ] `T-1.1`: Extend `lib/customers/customer-contracts.ts` with `CustomerUtangRowDTO`, `CustomerUtangSummaryDTO`, and `DebtStatus`.
- [ ] `T-1.2`: Implement `calculateCustomerUtangSummary` in `lib/customers/customer-service.ts` with debt age sorting descending, overdue evaluation, and KPI rollups.
- [ ] `T-1.3`: Expose `getCustomerUtangSummaryAction` in `lib/customers/customer-actions.ts`.

---

## Phase 2: UI Components & Route Integration

- [ ] `T-2.1`: Build `components/customers/customer-utang-tracker.tsx` matching `mockup/app.js` (lines 530-550) with breadcrumb, 3-column stats cards, table cards, overdue/not-yet-due pills, direct links, and empty state.
- [ ] `T-2.2`: Replace placeholder page in `app/(admin)/customers/balances/page.tsx` with live Server Component fetching utang summary and passing to `CustomerUtangTracker`.

---

## Phase 3: Automated Verification & Unit Tests

- [ ] `T-3.1`: Implement comprehensive test suite in `tests/customer-utang-tracker.test.ts` verifying all 6 Gherkin scenarios:
  - Scenario 1: Automatic debt age ranking descending.
  - Scenario 2: Overdue status badge and KPI calculation.
  - Scenario 3: Not yet due debt flagging and exclusion from overdue KPI.
  - Scenario 4: Direct profile navigation URL integrity.
  - Scenario 5: Direct receipt navigation URL integrity.
  - Scenario 6: All accounts settled empty state.
- [ ] `T-3.2`: Execute tests via `node --no-warnings=ExperimentalWarning --test --experimental-strip-types tests/customer-utang-tracker.test.ts`.

---

## Phase 4: Convergence & Verification

- [ ] `T-4.1`: Run `npm run typecheck` and `npm run lint`.
- [ ] `T-4.2`: Run full test suite `npm test`.
- [ ] `T-4.3`: Stage and commit with atomic conventional commits referencing `[ARL-19]`.
- [ ] `T-4.4`: Push branch and open Pull Request.
