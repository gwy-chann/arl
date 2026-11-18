# Technical Implementation Plan: Customer Profile Persistence & Real-Time Balances Cache Invalidation

**Feature Key**: `ARL-37`  
**Feature Slug**: `026-customer-profile-persistence-balances-sync`  
**Jira Story**: STORY-4.4: Customer Profile Persistence & Real-Time Balances Cache Invalidation  
**Epic**: `EPIC-4: Analytics, Dashboard & Reporting` (`ARL-17`)  

---

## 1. Architectural Overview & Boundaries

```mermaid
flowchart TD
    Client[Browser / Staff User] -->|POST updateCustomerAction| CA[lib/customers/customer-actions.ts]
    Client -->|POST updateSalePaymentAction| SA[lib/sales/sale-actions.ts]
    Client -->|POST submitNewSale| SA

    CA -->|Writes to public.customers| DB[(Supabase PostgreSQL)]
    SA -->|Writes to public.sales| DB

    CA -->|revalidatePath| Cache[Next.js App Router Cache]
    SA -->|revalidatePath| Cache

    subgraph Cache Invalidation Coverage
        Cache -->|Purge| R1[/customers]
        Cache -->|Purge| R2[/customers/:id]
        Cache -->|Purge| R3[/customers/balances]
        Cache -->|Purge| R4[/reports/balances]
        Cache -->|Purge| R5[/dashboard]
    end

    Client -->|GET /customers/balances| BalancesPage[app/customers/balances/page.tsx]
    BalancesPage --> Tracker[components/customers/customer-utang-tracker.tsx]
    Tracker -->|Navigation Signpost| DirectoryLink[Link to /customers Directory]
```

---

## 2. Component Hierarchy & Deliverables

1. **Database Migration (`supabase/migrations/20261118230000_grant_public_table_privileges.sql`)**:
   - Grant USAGE and ALL privileges on schema public tables, sequences, routines to `anon`, `authenticated`, and `service_role`.
   - Update default privileges for future database objects.
   - Idempotently configure RLS policies for `anon` across `customers`, `sales`, `sale_items`, `categories`, `products`, `product_variants`, `stock_movements`, and `system_settings`.

2. **Customer Actions Cache Purge (`lib/customers/customer-actions.ts`)**:
   - In `createCustomerAction`: Add `revalidatePath('/customers/balances')`, `revalidatePath('/reports/balances')`, and `revalidatePath('/dashboard')`.
   - In `updateCustomerAction`: Add `revalidatePath('/customers/balances')`, `revalidatePath('/reports/balances')`, and `revalidatePath('/dashboard')`.

3. **Sale Actions Cache Purge (`lib/sales/sale-actions.ts`)**:
   - In `submitNewSale`: Add `revalidatePath('/customers/balances')` and `revalidatePath('/reports/balances')`.
   - In `updateSalePaymentAction`: Add `revalidatePath('/customers/balances')` and `revalidatePath('/reports/balances')`.

4. **Utang Tracker UX Signposts (`components/customers/customer-utang-tracker.tsx`)**:
   - Header button group linking directly to `/customers` ("All Customers Directory") and `/customers/new` ("+ Add Customer").
   - Informative clarification banner/caption indicating that this page only shows customers with active utang (`balance > 0`).
   - Empty state guidance linking back to `/customers` for settled accounts.

5. **Customer Service Logging & Resilience (`lib/customers/customer-service.ts`)**:
   - Improve warning logging in `createCustomer` and `updateCustomer` when Supabase operations encounter errors, ensuring informative error messages are printed rather than silent failures.

6. **Regression Tests (`tests/customer-utang-tracker.test.ts` & `tests/customer-profile.test.ts`)**:
   - Verify that updates to customer names and phones persist and reflect across both customer profile and utang tracker rollups.
   - Verify that full payment of a debt removes customer from debtor list while keeping them in directory.
   - Verify that adding a credit sale moves customer from ₱0 settled status into the active balances list.
