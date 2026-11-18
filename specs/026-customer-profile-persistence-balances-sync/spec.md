# Feature Specification: Customer Profile Persistence & Real-Time Balances Cache Invalidation

**Feature Key**: `ARL-37`  
**Feature Slug**: `026-customer-profile-persistence-balances-sync`  
**Jira Story**: [ARL-37](https://the-three-devsketeers.atlassian.net/browse/ARL-37): STORY-4.4: Customer Profile Persistence & Real-Time Balances Cache Invalidation  
**Epic**: `EPIC-4: Analytics, Dashboard & Reporting` (`ARL-17`)  
**Status**: Ready for Planning & Implementation  

---

## Clarifications

### Session 2026-11-18
- Q: What exact database permissions are required to prevent Supabase 42501 (permission denied) errors across both authenticated and anon roles? → A: Grant `USAGE` on schema `public` and `ALL` on all tables, sequences, and routines in schema `public` to `anon`, `authenticated`, and `service_role`. In addition, create explicit RLS policies granting full access (`FOR ALL`) to `anon` for `customers`, `sales`, `sale_items`, `categories`, `products`, `product_variants`, `stock_movements`, and `system_settings` to support storefront and cashier operations.
- Q: Which Next.js route paths must be invalidated upon customer profile mutations and sales/payment updates? → A: On customer creation/update: `/customers`, `/customers/[id]`, `/customers/balances`, `/reports/balances`, and `/dashboard`. On sales creation or payment update (`updateSalePaymentAction`): `/sales`, `/sales/[id]`, `/customers`, `/customers/balances`, `/reports/balances`, `/reports`, `/inventory`, and `/dashboard`.
- Q: How should `/customers/balances` guide users looking for customers with ₱0 balance? → A: Add clear contextual signposts: header action buttons linking to `/customers` ("All Customers Directory") and `/customers/new` ("+ Add Customer"), an informational banner clarifying that the balances view filters strictly for active debtors (`balance > 0`), and an empty state linking directly to the full Customer Directory.
- Q: How does the customer service handle Supabase query failures? → A: When Supabase client operations succeed, results are written directly to PostgreSQL and mirrored in memory. If Supabase returns an error or is unreachable, the system gracefully falls back to the in-memory store while logging clear operational diagnostics, ensuring zero downtime for offline/disconnected environments.

---

## 1. User Story

**As an** ARLQ Store Administrator,  
**I want** customer contact information and sales balances to update immediately and persist permanently in the database,  
**so that** the Utang Tracker displays live, accurate debtor records and contact numbers without data loss or stale cache states.

---

## 2. Business Context & Store Operations

In Philippine food condiments wholesale and retail operations:
1. **Sari-Sari Stores & Eatery Credit (Utang)**:
   - Small food establishments (e.g. *Aling Nena's Sari-Sari Store*, *Mang Tonyo Carinderia*, *Tito Boy Lechon Haus*) frequently purchase Soy Sauce, Vinegar, and Fish Sauce by the box on consignment or short-term credit.
   - Cashiers and administrators frequently update customer contact details (mobile numbers, store addresses) when owners change SIM cards or shop branches.
2. **Persistence Integrity**:
   - Updates must write directly to PostgreSQL so that restarting the server, recompiling Next.js, or redeploying does not revert phone numbers or wipe newly registered customers (e.g., *Aling Roselle*).
3. **Cache Synchronization**:
   - When a cashier updates a customer's phone number on `/customers/[id]/edit` or records a debt payment on `/sales/[id]`, the dedicated Utang Tracker (`/customers/balances`) and the Balances Report (`/reports/balances`) must reflect the change immediately without requiring a browser hard refresh.

---

## 3. Root Cause Analysis

During store operations, three interrelated defects prevented real-time persistence and balance consistency:
1. **Missing Schema Privileges & RLS on PostgreSQL Tables**:  
   Tables in the `public` schema (`customers`, `sales`, etc.) lacked explicit table-level permission grants (`GRANT ALL`) and RLS policies for the `anon` role. Queries through the Supabase client triggered error `42501: permission denied for table customers`, silently falling back to a temporary in-memory RAM array (`INITIAL_CUSTOMERS`) that was wiped whenever the server recompiled.
2. **Missing Next.js Route Cache Invalidation**:  
   Customer mutation server actions (`updateCustomerAction`, `createCustomerAction`) only called `revalidatePath('/customers')` and `revalidatePath('/customers/[id]')`, but omitted `revalidatePath('/customers/balances')` and `revalidatePath('/reports/balances')`. Next.js consequently served stale, cached snapshot data on the Balances page.
3. **Directory vs. Balances Filter Ambiguity**:  
   Users navigating to `/customers/balances` (which filters strictly for `balance > 0`) could not find registered customers who have settled accounts (₱0 balance), requiring clearer UX signposts to the full Customer Directory (`/customers`).

---

## 4. Acceptance Criteria (BDD Gherkin)

### Scenario 1: Customer Profile Updates Persist to Database
- **Given** an existing customer (e.g., *Aling Nena's Sari-Sari Store*)
- **When** the administrator updates their phone number via the Customer Edit Form (`/customers/[id]/edit`)
- **Then** the updated phone number must be written directly to the PostgreSQL `public.customers` table
- **And** the update must survive server restarts, hot reloads, and browser cache clears without reverting.

### Scenario 2: Immediate Cache Revalidation on Balances Page
- **Given** a customer with an active debt balance appears on `/customers/balances`
- **When** the administrator updates the customer's phone number or name via `updateCustomerAction()`
- **Then** `updateCustomerAction()` automatically invalidates `/customers/balances`, `/reports/balances`, and `/dashboard`
- **And** navigating to or viewing the Balances page immediately displays the updated contact information without requiring a hard browser refresh.

### Scenario 3: Real-time Utang List Membership on Payment & Sale
- **Given** a customer has an outstanding balance
- **When** the customer fully settles their balance (`balance = 0`) via `updateSalePaymentAction()`
- **Then** the cache for `/customers/balances`, `/reports/balances`, and `/dashboard` is revalidated
- **And** the customer is automatically removed from the Balances list while remaining fully accessible in the main Customer Directory (`/customers`).
- **When** a customer with ₱0 balance makes a new credit purchase (`balance > 0`) via `submitNewSale()`
- **Then** `submitNewSale()` invalidates `/customers/balances` and `/reports/balances`
- **And** the customer immediately appears on `/customers/balances` with an updated days-outstanding count.

### Scenario 4: Creating New Customers (e.g., Aling Roselle)
- **Given** an administrator adds a new customer (*Aling Roselle*) with ₱0 debt via `createCustomerAction()`
- **When** the customer is saved
- **Then** the customer record is persisted in PostgreSQL
- **And** the customer appears in the Customer Directory (`/customers`)
- **And** does **not** appear on `/customers/balances` until an unpaid or partially paid sale is registered against their account.

### Scenario 5: Clear Navigation Signposts for Settled Accounts
- **Given** an administrator navigates to `/customers/balances`
- **When** viewing the Utang Tracker page
- **Then** the page header displays a clear action button linking to the full Customer Directory (`/customers`)
- **And** the empty state / search toolbar provides an explicit note informing the user that customers with ₱0 balance are listed in the Customer Directory.

---

## 5. Technical Scope & Architecture

### 5.1 Database Migration: Postgres Privileges & Anon RLS
Migration file: `supabase/migrations/20261118230000_grant_public_table_privileges.sql`:
1. Schema USAGE and ALL privileges on tables, sequences, routines granted to `anon`, `authenticated`, and `service_role`.
2. Default privileges altered for future tables/sequences/routines.
3. RLS policies allowing `anon` access to `customers`, `sales`, `sale_items`, `categories`, `products`, `product_variants`, `stock_movements`, and `system_settings`.

### 5.2 Server Action Cache Invalidation
1. `lib/customers/customer-actions.ts`:
   - In `createCustomerAction`: revalidate `/customers`, `/customers/${id}`, `/customers/balances`, `/reports/balances`, `/dashboard`.
   - In `updateCustomerAction`: revalidate `/customers`, `/customers/${id}`, `/customers/balances`, `/reports/balances`, `/dashboard`.
2. `lib/sales/sale-actions.ts`:
   - In `submitNewSale`: revalidate `/sales`, `/sales/new`, `/inventory`, `/customers`, `/customers/balances`, `/reports/balances`, `/dashboard`.
   - In `updateSalePaymentAction`: revalidate `/sales`, `/sales/${saleId}`, `/customers`, `/customers/balances`, `/reports/balances`, `/dashboard`.

### 5.3 UX Signposts & Empty State Enhancement
1. `components/customers/customer-utang-tracker.tsx`:
   - Header button linking to `/customers` ("All Customers Directory") and `/customers/new` ("+ Add Customer").
   - Informational helper note in the search/filter section clarifying the `balance > 0` filter.
   - Empty state message linking to `/customers` when all debts are settled or search query yields no active debtor.
