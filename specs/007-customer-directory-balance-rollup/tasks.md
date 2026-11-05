# Tasks: Customer Directory with Contact Book & Balance Rollup

**Feature Key**: `ARL-9`  
**Feature Slug**: `007-customer-directory-balance-rollup`  

---

## Task Matrix & Execution Plan

- [x] **Task 1: Database Schema & Seed Migration** (`supabase/migrations/20261105020000_create_customers_and_sales_tables.sql`)
  - Create `customers` table with `id`, `name`, `phone`, `address`, `created_at`, `updated_at`.
  - Create `sales` table with `id`, `receipt_number`, `customer_id`, `total_amount`, `amount_paid`, `payment_status`, `order_status`.
  - Enable RLS policies for authenticated users.
  - Insert initial seed customers and sales matching `mockup/app.js` (including Aling Nena with ₱1,340.00 debt and fully settled customers).

- [x] **Task 2: Contracts & Domain Service Engine** (`lib/customers/`)
  - Implement `lib/customers/customer-contracts.ts` with Zod validation (`customerInputSchema`).
  - Implement `lib/customers/customer-service.ts` with customer repository, live balance rollup calculation, currency formatter (`pesoD`), search filtering, and fallback in-memory store.
  - Implement `lib/customers/customer-actions.ts` with server actions (`createCustomerAction`, `updateCustomerAction`).

- [x] **Task 3: Unit Tests (TDD)** (`tests/customers.test.ts`)
  - Test Zod validation rules (name, phone, address).
  - Test Scenario 1: Customer registration validation and creation.
  - Test Scenario 2: Real-time search filtering (case-insensitive substring match).
  - Test Scenario 3: Debt balance highlighting ($> 0$ formatted as `₱X,XXX.XX` in `text-danger`).
  - Test Scenario 4: Fully paid balance display ($= 0$ formatted as `-` in `text-text-muted`).
  - Test live balance rollup aggregation from multiple sales.

- [x] **Task 4: UI Components** (`components/customers/`)
  - Implement `components/customers/customer-table.tsx` with instant search filter, customer name, phone, address, purchases count, and balance styling.
  - Implement `components/customers/customer-form.tsx` for adding and editing customers with toast `"Customer saved"` and redirect to profile `/customers/[id]`.
  - Implement `components/customers/customer-profile.tsx` showing customer contact card, debt breakdown, and transaction history.

- [x] **Task 5: Next.js Admin App Routes** (`app/(admin)/customers/`)
  - Update `app/(admin)/customers/page.tsx` to render `CustomerTable` with live data.
  - Create `app/(admin)/customers/new/page.tsx` to render `CustomerForm`.
  - Create `app/(admin)/customers/[id]/page.tsx` to render `CustomerProfile`.
  - Create `app/(admin)/customers/[id]/edit/page.tsx` to render `CustomerForm` in edit mode.

- [x] **Task 6: Verification, Typecheck, and Atomic Commits**
  - Run `npm test` inside `.worktrees/ARL-9`.
  - Run `npm run typecheck` inside `.worktrees/ARL-9`.
  - Review all changes against Zero Hardcoded Colors Rule and WCAG 2.1 AA.
  - Stage and commit with atomic commits linked to `[ARL-9]`.
