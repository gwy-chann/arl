# Technical Research & Architecture Decisions: Customer Profile Persistence & Real-Time Balances Cache Invalidation

**Feature Key**: `ARL-37`  
**Feature Slug**: `026-customer-profile-persistence-balances-sync`  
**Jira Story**: STORY-4.4: Customer Profile Persistence & Real-Time Balances Cache Invalidation  
**Epic**: `EPIC-4: Analytics, Dashboard & Reporting` (`ARL-17`)  

---

## 1. Architectural Strategy & Root Cause Analysis

### 1.1 PostgreSQL Schema Privileges & RLS Grants
- **Defect Analysis**:
  - In earlier migrations (`20261105020000_create_customers_and_sales_tables.sql`), tables in `public` schema were created with RLS enabled and policies granted strictly `TO authenticated`.
  - Next.js server actions using `createClient()` with `NEXT_PUBLIC_SUPABASE_ANON_KEY` operate under the `anon` PostgreSQL role when users are not explicitly authenticated via Supabase session cookie.
  - Queries triggered Postgres error `42501: permission denied for table customers`.
  - The repository's `try/catch` and fallback logic caught the failure and defaulted to the in-memory array (`INITIAL_CUSTOMERS`), which did not persist across Node server restarts or hot reloads.
- **Architectural Decision**:
  - Grant table, sequence, and routine privileges in schema `public` to `anon`, `authenticated`, and `service_role`.
  - Add idempotent RLS policies (`CREATE POLICY IF NOT EXISTS` or `DROP POLICY IF EXISTS ... CREATE POLICY`) for `anon` role across all operational domain tables:
    - `public.customers`
    - `public.sales`
    - `public.sale_items`
    - `public.categories`
    - `public.products`
    - `public.product_variants`
    - `public.stock_movements`
    - `public.system_settings`
  - Ensure `ALTER DEFAULT PRIVILEGES` is executed so any future tables created automatically grant necessary access.

### 1.2 Next.js Route Cache Invalidation Matrix
- **Defect Analysis**:
  - Next.js App Router aggressively caches fetch requests and Server Component pages (Full Route Cache).
  - Calling `updateCustomerAction()` only invalidated `/customers` and `/customers/${id}`.
  - The Utang Tracker (`/customers/balances`) and Balances Report (`/reports/balances`) continued to serve stale HTML snapshots.
- **Architectural Decision**:
  - Standardize route invalidation lists across customer and sales actions:
    - Customer actions (`createCustomerAction`, `updateCustomerAction`):
      `['/customers', '/customers/${id}', '/customers/balances', '/reports/balances', '/dashboard']`
    - Sales actions (`submitNewSale`, `updateSalePaymentAction`):
      `['/sales', '/sales/${id}', '/inventory', '/customers', '/customers/balances', '/reports/balances', '/dashboard']`

### 1.3 Directory vs. Balances Filter Navigation UX
- **Defect Analysis**:
  - Cashiers searching for a customer who recently paid off their debt could not find them on `/customers/balances` and mistakenly thought the customer had been deleted from the database.
- **Architectural Decision**:
  - Add prominent navigation links and contextual copy to `CustomerUtangTracker`:
    - Top action button: "All Customers Directory" -> `/customers`.
    - Context caption: "Showing customers with active debt (> ₱0.00). Looking for fully paid accounts? Check the Customer Directory."
    - Empty state: Informative link back to `/customers`.

---

## 2. Technology Stack & Dependencies

- **Framework**: Next.js 16+ App Router (`revalidatePath`, Server Actions)
- **Database**: Supabase / PostgreSQL (Schema privileges, RLS policies)
- **Design System**: ARLQ Semantic Design Tokens (`lib/tokens.ts`, `app/globals.css`, zero hardcoded hex)
- **Testing**: Node Test Runner (`node:test`) + `assert/strict`
