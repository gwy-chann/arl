# Feature Specification: Customer Profile View with Purchase Ledger & Debt Breakdown

**Feature Key**: `ARL-10`  
**Feature Slug**: `008-customer-profile-ledger-debt`  
**Jira Story**: STORY-2.4: Customer Profile View with Purchase Ledger & Debt Breakdown  
**Epic**: EPIC-2: Core Domain Entities & Primary CRUD Operations (`ARL-6`)  
**Status**: Ready for Planning  

---

## 1. User Story

**As an** ARLQ store administrator,  
**I want to** inspect a customer's profile page containing their full transaction history, total debt balance, and itemized unpaid sales with overdue indicators,  
**so that** I can audit customer standing and initiate pre-filled sales transactions directly from their profile.

---

## 2. Business Invariants & Domain Rules

1. **Profile Navigation & Routing (`/customers/[id]`)**:
   - The route `/customers/[id]` displays the profile hub for the customer whose identifier matches `id`.
   - If the customer does not exist in the database or store, the route renders Next.js `notFound()`.
   - Breadcrumb navigation: `Customers` (`/customers`) / `[Customer Name]`.

2. **Customer Identity Header & Action Controls**:
   - Displays customer `name` as the main heading (`text-[26px] font-bold text-text-primary`).
   - Displays contact line: `[phone] · [address]` (or phone only if address is empty) in `text-text-muted`.
   - Action controls:
     - **Edit Customer**: secondary button (`bg-secondary hover:bg-secondary-hover text-text-primary border border-border`) linking to `/customers/[id]/edit`.
     - **New Sale**: primary button (`bg-primary hover:bg-primary-hover text-text-light`) linking to `/sales/new?customerId=[id]` which pre-selects this customer in the New Sale wizard.

3. **Transaction History Ledger**:
   - Left-hand / main 2-column section (`lg:col-span-2`) displaying all recorded sales for this customer.
   - Table columns:
     1. **Receipt**: Receipt number (e.g., `ARLQ-01041`) linking to `/sales/[id]`.
     2. **Date**: Sale transaction date formatted as `MMM D, YYYY` (e.g., `Oct 18, 2026`).
     3. **Total**: Total sale price in PHP formatted to 2 decimal places (e.g., `₱560.00`).
     4. **Balance**: Unpaid remainder. If $> 0$, styled in bold destructive red (`text-danger font-semibold`). If zero, rendered as a muted dash (`-` in `text-text-muted`).
     5. **Payment**: Status badge/pill (`Paid` in `bg-success-light text-success`, `Partially Paid` in `bg-accent-light text-accent`, `Not Yet Paid` in `bg-danger-light text-danger`).
     6. **Order**: Order status pill (`Delivered` in `bg-success-light text-success`, `Pending` in `bg-accent-light text-accent`, `Picked Up` in `bg-info-light text-info`).
   - If customer has no purchase history, displays empty state: *"No purchases yet"* and *"Record a sale to start this customer's transaction history."*

4. **Outstanding Balance & Debt Breakdown Card**:
   - Right-hand side card (`lg:col-span-1`).
   - Displays the customer's total unpaid debt balance formatted in PHP (`text-[30px] font-bold`).
     - If debt $> 0$: highlighted in bold red (`text-danger`).
     - If debt $= 0$: displays `₱0.00` in standard ink (`text-text-primary`) with note *"Fully paid. Nothing is owed."*
   - Itemized Unpaid Sales Breakdown:
     - Displays count: `"Across X unpaid sales."` (or `"Across 1 unpaid sale."`).
     - For each unpaid transaction:
       - Displays receipt number with link to `/sales/[id]`.
       - Displays days outstanding (e.g., `"14 days outstanding"`).
       - Displays itemized unpaid balance in `text-danger font-semibold`.
       - If days outstanding $\ge 7$ (or configured reminder days threshold), displays an `"Overdue"` status pill (`bg-danger-light text-danger border border-danger-border`).

5. **Pre-Selected New Sale Trigger Integration**:
   - Clicking `"New sale"` from the customer profile navigates to `/sales/new?customerId=[id]`.
   - The New Sale page reads `customerId` from URL search parameters and automatically pre-selects this customer in the customer dropdown selector.

6. **Strict Semantic Design Tokens (Zero Hardcoded Colors Rule)**:
   - Adheres strictly to `AGENTS.md` and `.agents/rules/tailwind-v4.md`.
   - Zero hardcoded hex colors or arbitrary Tailwind palette classes.
   - Uses semantic variables: `bg-bg-surface`, `border-border`, `text-text-primary`, `text-text-muted`, `text-danger`, `bg-danger-light`, `bg-success-light`, `text-success`, `bg-accent-light`, `text-accent`.

---

## 3. Gherkin Acceptance Criteria

```gherkin
Feature: Customer Profile View with Purchase Ledger & Debt Breakdown (ARL-10)

  Scenario 1: Customer profile overview with debt
    Given customer "Mang Tonyo Carinderia" with ₱240.00 outstanding across 1 unpaid sale
    When the admin opens Mang Tonyo's profile ("/customers/k2")
    Then the header shows contact "0928 554 1290 · Public Market Stall 14"
    And the right card highlights outstanding debt "₱240.00" in red ("text-danger")
    And the unpaid sale is listed with days outstanding and an "Overdue" status pill

  Scenario 2: Transaction history table
    Given a customer with 5 past transactions (3 Paid, 2 Partially Paid)
    When viewing their profile
    Then the transaction history table lists all 5 receipts chronologically
    And displays receipt number, date, total, remaining balance, payment pill, and order pill

  Scenario 3: Pre-selected new sale trigger
    Given an admin on any customer profile
    When they click the "New sale" action button in the header
    Then the New Sale checkout wizard opens with this customer already selected in the dropdown

  Scenario 4: Fully settled customer account
    Given a customer with no unpaid sales
    When viewing their profile
    Then the balance displays "₱0.00" with note "Fully paid. Nothing is owed."
```
