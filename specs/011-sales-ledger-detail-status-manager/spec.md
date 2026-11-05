# Feature Specification: Sales Transaction Ledger, Detail View & Status Manager

**Feature Key**: `ARL-15`  
**Feature Slug**: `011-sales-ledger-detail-status-manager`  
**Jira Story**: STORY-3.4: Sales Transaction Ledger, Detail View & Status Manager  
**Epic**: EPIC-3: Interactive Workflows, Transactions & Business Logic (`ARL-11`)  
**Status**: Ready for Planning  

---

## 1. User Story

**As an** ARLQ store administrator,  
**I want to** browse all sales transactions, view itemized receipts, and independently update customer payments and fulfillment delivery states,  
**so that** order fulfillment progress and debt settlements are kept up to date.

---

## 2. Business Invariants & Rules

1. **Sales Transaction Ledger (`/sales`)**:
   - Displays all historical and newly ringed up transactions in reverse chronological order (`created_at DESC`).
   - Interactive search toolbar filters by receipt number (e.g. `ARLQ-01041`) or customer name in real time without lag.
   - Filter dropdowns allow independent filtering:
     - Payment Status filter: `All payments`, `Paid`, `Partially Paid`, `Not Yet Paid`.
     - Order Fulfillment Status filter: `All orders`, `Pending`, `Delivered`, `Picked Up`.
   - Table columns:
     - **Receipt**: Bold sequential receipt code (e.g., `ARLQ-01041`).
     - **Date**: Formatted transaction timestamp (e.g., `Oct 11, 2026`).
     - **Customer**: Customer business/individual name.
     - **Total**: Grand total revenue formatted in Philippine Pesos (`₱500.00`).
     - **Balance**: Outstanding debt. If `balance > 0`, highlighted in red bold text (`₱240.00`). If fully settled, displays muted hyphen (`-`).
     - **Payment**: Status pill with semantic tokens:
       - `Paid`: Success green token (`pill ok`).
       - `Partially Paid`: Warning amber token (`pill warn`).
       - `Not Yet Paid`: Danger red token (`pill bad`).
       - If overdue (`balance > 0` and `days_unpaid >= reminder_days`): appends danger `Overdue` pill.
     - **Order**: Order status pill with semantic tokens:
       - `Pending`: Warning amber token (`pill warn`).
       - `Delivered`: Informational blue token (`pill info`).
       - `Picked Up`: Informational blue token (`pill info`).
   - Clicking any table row navigates directly to `/sales/{id}`.
   - Includes header action button `+ New sale` linking to `/sales/new`.

2. **Sale Detail View (`/sales/{id}`)**:
   - Header: Receipt number title, subtitle displaying date and customer name, and breadcrumbs (`Sales > ARLQ-XXXXX`).
   - Action button: `Print receipt` link to `/receipt/{id}`.
   - **Overdue Alert Banner**:
     - Displayed when `balance > 0` and `days_unpaid >= reminder_days` (default threshold: 7 days, configurable in system settings).
     - Renders danger surface card (`bg-danger-light border-danger-border`) with a red dot indicator.
     - Message:
       - **Headline**: `Overdue by ${days_overdue} day(s) past the reminder limit.`
       - **Subtext**: `Unpaid for ${days_unpaid} days. An SMS reminder was sent to ${admin_mobile}. It stops when you mark this sale as Paid.`
   - **Line Items Breakdown**:
     - Itemized list of purchased condiment variants: Product name with packaging size (e.g. `Patis - 1 L`), Quantity, Unit Price, Line Total, and Gross Profit.
     - Table footer summarizing Grand Total and Total Gross Profit.
   - **Customer Information Card**:
     - Displays customer name (linking to `/customers/{customer_id}`), phone contact, and delivery address.

3. **Status Management & Settlement Engine**:
   - **Payment Manager Card**:
     - Displays summary lines: Grand Total, Amount Paid, and Remaining Balance (highlighted in red if > 0).
     - Segmented control options: `Paid`, `Partially Paid`, `Not Yet Paid`.
     - When `Partially Paid` is selected, reveals numeric `Amount paid` input bounded between `₱1.00` and `₱Total - 0.01`.
     - Clicking "Save payment":
       - If `Paid`: Sets `amount_paid = total_amount`, `balance = 0`. Overdue banner immediately disappears.
       - If `Not Yet Paid`: Sets `amount_paid = 0`, `balance = total_amount`.
       - If `Partially Paid`: Sets `amount_paid = input_amount`, `balance = total_amount - input_amount`.
       - Updates customer debt rollup balance across all unpaid sales.
       - Triggers confirmation toast: `Payment updated: Paid. Reminders stopped.` (or `Payment updated: Partially Paid` / `Payment updated: Not Yet Paid`).
   - **Order Fulfillment Manager Card**:
     - Segmented control options: `Pending`, `Delivered`, `Picked Up`.
     - Clicking "Save order status":
       - Updates `order_status` in the database and in-memory store.
       - Order status pill updates to match new state.
       - Triggers confirmation toast: `Order marked Delivered` (or `Order marked Picked Up` / `Order marked Pending`).

---

## 3. Acceptance Criteria & Gherkin Scenarios

### Scenario 1: Sales ledger search and status filtering
- **Given** sales with various payment states (Paid, Partially Paid, Not Yet Paid) and order states (Pending, Delivered, Picked Up)
- **When** the admin selects "Not Yet Paid" in the payment filter
- **Then** only unpaid sales are displayed in the table
- **And** clicking any row navigates directly to that sale's detail page (`/sales/{id}`).

### Scenario 2: Overdue sale alert banner
- **Given** a sale with balance > 0 that has been unpaid for 9 days (threshold = 7 days)
- **When** viewing the sale detail page
- **Then** an alert banner is displayed: "Overdue by 2 days past the reminder limit. Unpaid for 9 days. An SMS reminder was sent..."

### Scenario 3: Payment status update to fully paid
- **Given** an unpaid sale of ₱1,340.00 displaying the overdue alert banner
- **When** the admin changes the payment segmented control to "Paid" and clicks "Save payment"
- **Then** the database updates `amount_paid = 1340.00` and `balance = 0`
- **And** the overdue banner disappears
- **And** a toast confirms: "Payment updated: Paid. Reminders stopped."

### Scenario 4: Order fulfillment state transition
- **Given** an order in status "Pending"
- **When** the goods are dispatched and the admin toggles order status to "Delivered" and saves
- **Then** the order status pill updates to "Delivered" with an informational blue token.

---

## 4. Edge Cases & Boundary Handling

1. **Non-existent Sale ID**:
   - Visiting `/sales/invalid-id` renders a clean "Sale not found" message with a "Back to sales" button instead of crashing.
2. **Partial Payment Boundary Validation**:
   - Amount paid must be greater than 0 and less than the total amount (`0 < amount < total`).
   - Input `<= 0` or `>= total` is rejected with an actionable validation toast.
3. **Overdue Days Thresholds**:
   - If `days_unpaid === reminder_days`, `days_overdue = 0`. The banner displays `Overdue by 0 days past the reminder limit.`
   - If `days_unpaid > reminder_days`, pluralization is strictly handled (`1 day`, `2 days`).
   - Once balance reaches 0, the overdue banner is immediately unmounted regardless of days elapsed.
4. **Independent Status Mutations**:
   - Updating payment status must not mutate order status.
   - Updating order status must not mutate payment status or amount paid.
5. **Customer Debt Synchronization**:
   - Modifying a sale's payment status or amount paid must immediately synchronize the customer's total outstanding debt rollup across the customer profile and dashboard.
