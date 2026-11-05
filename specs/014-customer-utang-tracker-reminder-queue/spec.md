# Feature Specification: Customer Utang (Credit Balance) Tracker & Overdue Reminder Queue

**Feature Key**: `ARL-19`  
**Feature Slug**: `014-customer-utang-tracker-reminder-queue`  
**Jira Story**: STORY-4.2: Customer Utang (Credit Balance) Tracker & Overdue Reminder Queue  
**Epic**: EPIC-4: Business Intelligence, Analytics & Financial Reporting (`ARL-17`)  
**Status**: Ready for Implementation  

---

## 1. User Story

**As an** ARLQ store administrator,  
**I want to** monitor customer credit balances in a dedicated utang center sorted by age of debt with overdue badges,  
**so that** I can prioritize collections and track payment reminder schedules.

---

## 2. Business Invariants & Domain Rules

1. **Dedicated Utang Center Route & Breadcrumbs (`/customers/balances`)**:
   - The route `/customers/balances` displays the dedicated utang center for customers with unpaid balances.
   - Page header displays:
     - Title: `Customers with balances (utang)`
     - Subtitle: `Unpaid and partially paid sales.`
     - Breadcrumbs: `Customers` (`/customers`) / `Balances` (`/customers/balances`).
   - The sidebar navigation item for "Customers" (and sub-item "Customers with balances") remains highlighted.

2. **Automatic Debt Age Ranking**:
   - Only customers with an active unpaid balance (`balance > 0`) are included in the utang ledger.
   - For each customer with unpaid sales, the age of debt is determined by the oldest unpaid sale:
     $$\text{oldest\_days} = \max_{s \in \text{unpaid\_sales}} (\text{days\_outstanding}(s))$$
   - Customers are automatically sorted in **descending order by the age of their oldest unpaid sale** (`b.oldest_days - a.oldest_days`).
   - If two customers have identical oldest unpaid sale ages, tie-breaking falls back to larger total balance descending (`b.total_balance - a.total_balance`).

3. **3-Column KPI Stats Highlight**:
   - At the top of the utang center, a 3-column stats panel (`.stats` with 3 columns) displays:
     1. **Total owed**:
        - Big label: Sum of all outstanding customer balances formatted in PHP currency (`₱X,XXX.XX`).
        - Subtext: Count of debtors (`${debtorCount} customers` or `${debtorCount} customer`).
     2. **Overdue (${reminderDays}+ days)**:
        - Big label: Sum of all overdue balances formatted in PHP currency, styled with `.alert` (bad red: `text-danger` / `var(--bad)`).
        - Subtext: Count of overdue customers (`${overdueCount} customers`).
     3. **Reminders Configuration**:
        - Big label: `SMS to ${adminMobile}` (e.g., `SMS to 0917 555 0142`).
        - Subtext: `after ${reminderDays} days unpaid` (e.g., `after 7 days unpaid`).
   - All values dynamically respect system reminder settings (`reminder_days` and `admin_mobile`).

4. **Status Badge Flagging**:
   - When a customer's oldest unpaid sale age $\ge \text{reminderDays}$ (e.g. 7 days):
     - Status pill renders `"Overdue"` with bad red semantic styling (`pill bad` / `bg-danger-light text-danger border border-danger-border`).
     - This customer's debt contributes to the "Overdue" KPI card.
   - When a customer's oldest unpaid sale age $< \text{reminderDays}$:
     - Status pill renders `"Not yet due"` with warning amber semantic styling (`pill warn` / `bg-accent-light text-accent border border-accent-border`).

5. **Table Columns & Action Controls**:
   - Responsive card-based table (`.tbl-cards` / `.tbl-wrap`):
     - **Customer**: Customer name in bold (`font-semibold text-text-primary`), mobile phone below in muted text (`text-text-muted text-xs`).
     - **Oldest unpaid sale**: Receipt number as a clickable link (`/sales/[id]`) with sale date below in muted text (`MMM D, YYYY`).
     - **Days outstanding**: Numeric age of oldest unpaid sale (`num` text-right, tabular numbers).
     - **Balance**: Total unpaid customer debt formatted in PHP (`pesoD(balance)` in bold).
     - **Status**: Status pill badge (`Overdue` vs `Not yet due`).
     - **Action**: Secondary action button labeled `"Open profile"` (`btn sec sm`) linking to `/customers/[id]`.

6. **Empty State Behavior**:
   - When no customers have outstanding balances (`rows.length === 0`):
     - Displays empty placeholder banner with title `"No balances"` and subtitle `"All customer accounts are fully paid."`
     - Total owed and Overdue KPI cards display `₱0.00` and `0 customers`.

7. **Zero Hardcoded Colors & Design System Alignment**:
   - All UI surfaces, badges, borders, and text adhere strictly to semantic design tokens:
     - `bg-bg-surface`, `bg-bg-base`, `border-border`, `text-text-primary`, `text-text-secondary`, `text-text-muted`
     - `text-danger`, `bg-danger-light`, `border-danger-border` (Overdue badges and alert stats)
     - `text-accent`, `bg-accent-light`, `border-accent-border` (Not yet due warning badges)
     - Secondary button: `bg-secondary hover:bg-secondary-hover text-text-primary border border-border`

---

## 3. Gherkin Acceptance Criteria

```gherkin
Feature: Customer Utang (Credit Balance) Tracker & Overdue Reminder Queue (ARL-19)

  Scenario 1: Automatic debt age ranking
    Given multiple customers with unpaid balances:
      | customer_id | name                          | oldest_sale_days | balance   |
      | k1          | Aling Nena's Sari-Sari Store | 10               | ₱1,340.00 |
      | k2          | Mang Tonyo Carinderia        | 19               | ₱240.00   |
      | k7          | Tito Boy Lechon Haus         | 30               | ₱300.00   |
      | k8          | Jun-Jun's Turo-Turo          | 3                | ₱200.00   |
    When the admin navigates to "/customers/balances"
    Then customers are automatically sorted descending by the age of their oldest unpaid sale:
      | rank | name                          | days_outstanding |
      | 1    | Tito Boy Lechon Haus         | 30               |
      | 2    | Mang Tonyo Carinderia        | 19               |
      | 3    | Aling Nena's Sari-Sari Store | 10               |
      | 4    | Jun-Jun's Turo-Turo          | 3                |
    And the 3-column stats highlight:
      | Total owed | Overdue (7+ days) | SMS reminder configuration |
      | ₱2,080.00  | ₱1,880.00         | SMS to 0917 555 0142       |

  Scenario 2: Overdue status badge flagging
    Given a customer whose oldest unpaid sale is 9 days old (when reminder threshold is 7 days)
    When viewing the table
    Then their status pill displays "Overdue" in bad red ("var(--bad)" / "bg-danger-light text-danger")
    And their debt contributes to the "Overdue" KPI card.

  Scenario 3: Not yet due debt flagging
    Given a customer whose oldest unpaid sale is 3 days old (when reminder threshold is 7 days)
    When viewing the table
    Then their status pill displays "Not yet due" in warning amber ("var(--warn)" / "bg-accent-light text-accent")
    And their debt does not contribute to the "Overdue" KPI card.

  Scenario 4: Direct profile navigation
    Given any customer row in the debt table
    When the admin clicks "Open profile"
    Then the app navigates directly to "/customers/{id}" to view their full transaction ledger.

  Scenario 5: Direct receipt navigation
    Given any customer row in the debt table
    When the admin clicks the oldest unpaid sale receipt link
    Then the app navigates directly to "/sales/{id}" to inspect the sale invoice.

  Scenario 6: All accounts settled empty state
    Given all customer accounts are fully paid with 0 outstanding debt
    When the admin navigates to "/customers/balances"
    Then the KPI stats display "₱0.00" total owed and "₱0.00" overdue
    And the table renders empty state "No balances" with subtext "All customer accounts are fully paid."
```

---

## 4. Clarifications & Default Assumptions

- **Clarification 1 (Ranking Criterion)**: The table is sorted strictly by the age of the oldest unpaid sale (oldest first / highest `days_outstanding`), NOT total debt amount. (This directly addresses collection priority by debt age).
- **Clarification 2 (Reminder Threshold)**: The reminder threshold defaults to 7 days, configurable via system settings (`lib/settings/settings-service.ts`).
- **Clarification 3 (SMS Dispatch)**: The KPI card displays the active automated SMS reminder configuration (`SMS to ${admin_mobile} after ${reminder_days} days unpaid`). No manual SMS trigger button is required on this view as SMS notifications are governed by the background queue / settings.
- **Clarification 4 (SSR Hydration & As-Of Date)**: Age calculation takes an optional `asOf` date parameter to ensure deterministic rendering in automated tests and time-zone agnostic relative calculations.
