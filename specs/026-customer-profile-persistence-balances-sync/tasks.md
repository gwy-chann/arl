# Implementation Tasks: Customer Profile Persistence & Real-Time Balances Cache Invalidation

**Feature Key**: `ARL-37`  
**Feature Slug**: `026-customer-profile-persistence-balances-sync`  
**Jira Story**: STORY-4.4: Customer Profile Persistence & Real-Time Balances Cache Invalidation  
**Epic**: `EPIC-4: Analytics, Dashboard & Reporting` (`ARL-17`)  

---

## Phase 1: Setup & Foundational Database Privileges
- [ ] T001 Create database migration in `supabase/migrations/20261118230000_grant_public_table_privileges.sql` granting public schema privileges to anon, authenticated, and service_role, configuring default privileges, and adding anon RLS policies across all domain tables.

## Phase 2: User Story 1 - Customer Profile Persistence to Database [US1]
- [ ] T002 [US1] Enhance error logging and diagnostics in `lib/customers/customer-service.ts` for Supabase customer creation and updates.
- [ ] T003 [P] [US1] Add unit tests in `tests/customer-profile.test.ts` verifying customer updates persist and retain updated phone and name values across queries.

## Phase 3: User Story 2 - Immediate Cache Invalidation on Balances Page [US2]
- [ ] T004 [US2] Update `lib/customers/customer-actions.ts` to invalidate `/customers/balances`, `/reports/balances`, and `/dashboard` in `createCustomerAction` and `updateCustomerAction`.
- [ ] T005 [P] [US2] Add automated tests in `tests/customer-utang-tracker.test.ts` verifying that customer updates reflect immediately in debtor rollups and contact numbers.

## Phase 4: User Story 3 - Real-Time Utang List Membership on Payment & Sale [US3]
- [ ] T006 [US3] Update `lib/sales/sale-actions.ts` to invalidate `/customers/balances` and `/reports/balances` in `submitNewSale` and `updateSalePaymentAction`.
- [ ] T007 [P] [US3] Add automated tests in `tests/customer-utang-tracker.test.ts` verifying that settling a balance removes a debtor from the utang list while keeping them in the customer directory, and new credit sales immediately enroll debtors.

## Phase 5: User Story 4 - Directory vs. Balances UX Signposts [US4]
- [ ] T008 [US4] Update `components/customers/customer-utang-tracker.tsx` with header action buttons linking to `/customers` ("All Customers Directory") and `/customers/new`, contextual clarification text for the `balance > 0` filter, and an empty state linking to the directory.
- [ ] T009 [P] [US4] Verify accessibility and semantic design token compliance (`bg-bg-surface`, `text-text-primary`, `border-border`) in `components/customers/customer-utang-tracker.tsx` with zero hardcoded colors.

## Phase 6: Polish & Verification
- [ ] T010 Run full test suite (`npm test`) and typecheck (`npx tsc --noEmit`) to verify zero regressions.
