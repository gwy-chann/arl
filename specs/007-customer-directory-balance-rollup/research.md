# Technical Research: Customer Directory & Live Balance Rollup

**Feature Key**: `ARL-9`  
**Feature Slug**: `007-customer-directory-balance-rollup`  

---

## 1. Architectural Strategy & Stack Constraints

1. **Framework & Engine**:
   - Next.js 15+ App Router (`app/(admin)/customers/...`).
   - Server Component entry points (`page.tsx`) for initial data fetching and SSR hydration.
   - Client Components for interactive UI (`customer-table.tsx`, `customer-form.tsx`, `customer-search.tsx`).
   - Node.js native test runner (`node --test --experimental-strip-types`) for rapid, deterministic test execution.

2. **Database & Persistence (Supabase / PostgreSQL)**:
   - Tables:
     - `public.customers`: Master contact book table storing `id` (UUID), `name` (TEXT), `phone` (TEXT), `address` (TEXT), `created_at`, `updated_at`.
     - `public.sales`: Transaction records storing `id` (UUID), `receipt_number` (TEXT), `customer_id` (UUID FK -> `customers.id`), `total_amount` (NUMERIC(10,2)), `amount_paid` (NUMERIC(10,2)), `payment_status` (TEXT), `order_status` (TEXT), `created_at`, `updated_at`.
   - Security:
     - RLS enabled on `customers` and `sales` tables.
     - Policies permitting authenticated administrative users full CRUD operations.
   - Rollup Engine:
     - Service layer query executes an aggregated query:
       ```sql
       SELECT 
         c.id, c.name, c.phone, c.address, c.created_at, c.updated_at,
         COUNT(s.id)::int AS purchase_count,
         COALESCE(SUM(GREATEST(0, s.total_amount - s.amount_paid)), 0)::numeric(10,2) AS debt_balance
       FROM public.customers c
       LEFT JOIN public.sales s ON s.customer_id = c.id
       GROUP BY c.id;
       ```
     - For fallback / offline / mock mode when Supabase is not connected in local development/tests, an in-memory service repository simulates database behavior with matching mock data from `mockup/app.js`.

3. **Client-Side Real-Time Search**:
   - Instant filtering on input change (`onChange` / `useMemo`) across `name`, `phone`, and `address`.
   - Case-insensitive substring matching mirrors the mockup search behavior (`A.tf(this, 'ktbl')`).
   - Preserves focus and instant keystroke response without debounce latency.

4. **Formatting Utilities**:
   - Currency formatting: consistent Philippine Peso `formatCurrency(amount)` or `pesoD(amount)` producing `₱X,XXX.XX`.
   - Zero debt display: rendered as `<span className="text-text-muted">-</span>`.
   - Positive debt display: rendered as `<b className="text-danger font-semibold">₱1,340.00</b>`.

5. **Design System & Zero Hardcoded Colors**:
   - Semantic color tokens:
     - Danger / Bad debt: `text-danger` (`var(--bad)`).
     - Surface: `bg-bg-surface border border-border`.
     - Header / Text: `text-text-primary`, `text-text-muted`.
     - Primary button: `bg-primary hover:bg-primary-hover text-text-light`.
     - Secondary button: `bg-secondary hover:bg-secondary-hover text-text-primary border border-border`.
