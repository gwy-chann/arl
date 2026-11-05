# Feature Specification: Customer Directory with Contact Book & Balance Rollup

**Feature Key**: `ARL-9`  
**Feature Slug**: `007-customer-directory-balance-rollup`  
**Jira Story**: STORY-2.3: Customer Directory with Contact Book & Balance Rollup  
**Epic**: EPIC-2: Core Domain Entities & Primary CRUD Operations (`ARL-6`)  
**Status**: Ready for Planning  

---

## 1. User Story

**As an** ARLQ store administrator,  
**I want to** maintain a directory of regular buyers (sari-sari stores, carinderias, eateries, and individuals) with contact details, address, purchase count, and live debt balances,  
**so that** I can easily look up customer records and track who has unpaid balances.

---

## 2. Business Invariants & Rules

1. **Customer Record Integrity**:
   - Each customer record represents a regular commercial or retail buyer: sari-sari store, carinderia, eatery, or individual.
   - `name`: string between 1 and 100 characters, trimmed, required.
   - `phone`: valid Philippine contact phone string between 7 and 25 characters (e.g., `0917 301 4488`), trimmed, required.
   - `address`: text representation of delivery/store location (e.g., `Purok 3, Brgy. San Roque`), trimmed, optional (defaults to empty string).
2. **Purchase Count & Live Debt Rollup Calculation**:
   - `purchase_count`: integer count of all recorded sales transactions associated with `customer_id`.
   - `debt_balance`: aggregated sum of unpaid balances across all transactions for this customer:
     $$\text{debt\_balance} = \sum_{\text{sales}} \max(0, \text{total\_amount} - \text{amount\_paid})$$
   - Only transactions with remaining balance $> 0$ contribute to `debt_balance`.
3. **Debt Balance Display States**:
   - **Indebted ($> 0$)**: The balance column displays the currency amount formatted in Philippine Peso (e.g., `₱1,340.00` or `₱240.00`) in bold destructive red token (`var(--bad)` / `text-danger font-semibold`).
   - **Zero Debt ($= 0$)**: The balance column displays a muted dash (`-`) with `text-text-muted` indicating zero debt.
4. **Real-Time Directory Search Filtering**:
   - The directory toolbar provides an accessible search box (`Search name or contact`).
   - Typing queries (e.g., `"Carinderia"`, `"0917"`, `"San Roque"`) filters rows in real time across `name`, `phone`, and `address` (case-insensitive).
   - If no records match the filter query, an empty state is displayed: `"No matching customers"` with guidance.
5. **Form Submission & Navigation Flow**:
   - Dedicated Add Customer page at `/customers/new`.
   - Form fields:
     - "Customer or business name" (`name`, text, required)
     - "Mobile number" (`phone`, tel, required, placeholder `09XX XXX XXXX`)
     - "Address" (`address`, text, optional)
   - On valid submit, the customer record is persisted to Supabase `customers` table.
   - Admin is redirected to the customer profile view `/customers/[id]` with toast notification `"Customer saved"`.
   - Cancel action returns safely to `/customers`.
6. **Customer Profile Hub (`/customers/[id]`)**:
   - Header with Customer Name, subtext with Phone and Address, and action buttons (`Edit` and `New sale`).
   - Summary card displaying outstanding debt balance.
   - Transaction history table listing previous orders, totals, balances, and payment statuses.
7. **Strict Semantic Design Tokens (Zero Hardcoded Colors Rule)**:
   - Zero arbitrary hex or default Tailwind colors.
   - All components consume tokens from `lib/tokens.ts` and `app/globals.css`.
   - Primary buttons: `bg-primary hover:bg-primary-hover text-text-light`.
   - Secondary buttons: `bg-secondary hover:bg-secondary-hover text-text-primary border border-border`.
   - Badges / Debt: `text-danger font-semibold`.
   - Card containers: `bg-bg-surface border border-border rounded-[var(--r)]`.

---

## 3. Gherkin Acceptance Criteria

```gherkin
Feature: Customer Directory with Contact Book & Balance Rollup (ARL-9)

  Scenario 1: Registering a sari-sari store customer
    Given the admin is on "/customers/new"
    When they submit Name "Aling Nena's Sari-Sari Store", Phone "0917 301 4488", and Address "Purok 3, Brgy. San Roque"
    Then the record is created in Supabase
    And the admin is redirected to the customer's profile page with toast "Customer saved"

  Scenario 2: Real-time search filtering
    Given multiple customers in the directory
    When the admin types "Carinderia" into the search box
    Then only matching customer records remain visible in real time

  Scenario 3: Debt balance highlighting
    Given a customer with ₱1,340.00 in outstanding unpaid sales
    When viewing the customer directory table
    Then the balance column displays "₱1,340.00" in destructive red ("var(--bad)" / "text-danger")

  Scenario 4: Fully paid balance display
    Given a customer with zero unpaid sales
    When viewing the customer directory table
    Then the balance column displays a muted dash ("-") indicating zero debt
```
