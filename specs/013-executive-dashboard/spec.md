# Feature Specification: Executive Dashboard with KPI Cards, Sales Chart & Urgent Notices

**Feature Key**: `ARL-18`  
**Feature Slug**: `013-executive-dashboard`  
**Jira Story**: STORY-4.1: Executive Dashboard with KPI Cards, Sales Chart & Urgent Notices  
**Epic**: EPIC-4: Analytics, Dashboard & Reporting (`ARL-17`)  
**Status**: Ready for Planning  

---

## 1. User Story

**As an** ARLQ store administrator,  
**I want to** review real-time business KPIs, a 7-day sales visualizer chart, an inventory status matrix, and an urgent notice stream,  
**so that** I have immediate operational visibility upon logging into the system.

---

## 2. Business Invariants & Operational Rules

1. **Top-Level KPI Metric Cards (`.stats` / `.stat`)**:
   - The dashboard top banner features a 4-column responsive grid displaying core daily and operational metrics:
     - **Sales today**: Formatted sum of total sales completed today (Philippine Peso: `₱X,XXX.XX` or `₱X,XXX`), accompanied by subtitle `"{N} transactions"`.
     - **Sales this month**: Total gross sales recorded in the current calendar month, accompanied by subtitle `"Profit ₱X,XXX.XX"`.
     - **Outstanding balances**: Total unpaid utang (accounts receivable balance) across all sales, accompanied by subtitle `"{N} unpaid sales"`. When total outstanding > 0, the card enters `.stat.alert` warning state with text styled in danger/alert tokens.
     - **Low stock items**: Variant count currently at or below minimum threshold formatted as `"{low_count} of {total_count}"` (e.g. `"2 of 9"`), with subtitle `"at or below minimum"`. When `low_count > 0`, the card displays in `.stat.alert` warning styling.

2. **7-Day Sales Visualizer Bar Chart (`.bars` / `.bar`)**:
   - Renders a responsive 7-column bar chart representing daily sales across the rolling past 7 days (day index 6 down to 0, where 0 represents Today).
   - Each column renders:
     - Formatted currency label (`<em>₱...</em>`) or empty if 0 revenue.
     - Proportional bar height (`<i>`) calculated relative to the maximum daily sales across the 7-day window (`Math.max(dayTotal / maxDailyTotal * 100, 1.5)%`).
     - Day label: `"Today"` for day 0; short weekday name (e.g., `"Mon"`, `"Tue"`, `"Wed"`) for earlier days in Manila timezone (`en-PH`).
     - Active accent styling (`.bar.cur`) applied exclusively to the `"Today"` bar using the primary brand color token.
   - Header action links to `"Full report"` (`/reports`).

3. **Stock on Hand Matrix Table (`.stockgrid` / `.meter`)**:
   - Displays a structured 3×3 inventory matrix: all condiment products (Toyo, Suka, Patis) across all packaging sizes (350 ml, 1 L, 1 gal).
   - Each variant cell displays:
     - Bold stock count (`<b>{stock}</b>`).
     - Inline capacity meter (`.meter` / `.meter.low`) with progress bar (`<i>`) indicating capacity ratio:
       - Width percentage: `Math.min(stock / (min_stock_level * 2.5) * 100, 100)%`.
       - When `stock <= min_stock_level`, the meter applies `.meter.low` styling with danger/alert background color token.
   - Header link leads directly to `"Details"` (`/inventory`).

4. **Urgent Notice Stream (`.notice` / `.dot`)**:
   - Combines urgent operational notices into a single prioritized notification stream:
     - **Overdue Utang Notices**: Unpaid sales with days unpaid exceeding the reminder threshold (`days_unpaid >= reminder_days`).
       - Bad dot indicator (`.dot.bad`).
       - Message: `<b>{Customer Name}</b> owes {₱Balance}`.
       - Metadata: `Receipt {receipt_no} · unpaid for {days} days · SMS reminder sent`.
       - Action: `"Open sale"` button linking directly to `/sales/{id}`.
     - **Low Stock Warnings**: Variants at or below minimum stock threshold.
       - Warning dot indicator (`.dot.warn`).
       - Message: `<b>{Product Name} - {Size Label}</b> is running low`.
       - Metadata: `{stock} left · minimum is {min}`.
       - Action: `"Stock in"` button linking directly to `/inventory/in`.
   - Card header contains a badge pill displaying `"{N} need attention"` (`.pill.bad` if N > 0, `.pill.ok` if 0).
   - If no notices are pending, displays empty state: `<b>All clear</b> No overdue balances or low stock.`.

5. **Who Owes You Customer Debt Breakdown (`.rowlist`)**:
   - Aggregates unpaid balances by customer, presenting the top 5 customers with the highest outstanding utang.
   - Each row displays:
     - Customer name (`<b>{Customer Name}</b>`) and oldest unpaid sale duration (`Oldest unpaid: {N} days`).
     - Right side displays formatted outstanding balance (`₱...`) and, if oldest unpaid days >= reminder threshold, an `Overdue` pill.
     - Clicking navigates to `/customers/{id}`.
     - Header link leads to `"See all"` (`/customers/balances`).
     - If all debts are settled, displays empty state: `<b>No balances</b> Everyone has paid.`.

6. **Page Header & Primary Action Triggers**:
   - Salutation: `"Good day, Admin"` with subtitle displaying the formatted current date (`e.g., "Thursday, November 6, 2026"`).
   - Action triggers:
     - `+ New sale` button (primary) linking to `/sales/new`.
     - `Stock in` button (secondary) linking to `/inventory/in`.

---

## 3. Acceptance Criteria & Gherkin Scenarios

### Scenario 1: Executive KPI metrics computation
- **Given** transactions recorded today totaling ₱1,240.00 across 3 sales, and 2 variants below minimum stock
- **When** the admin lands on `/dashboard`
- **Then** "Sales today" displays "₱1,240" with subtitle "3 transactions"
- **And** "Low stock items" displays "2 of 9" in amber/alert warning styling
- **And** "Outstanding balances" displays total unpaid customer utang.

### Scenario 2: 7-day sales bar chart rendering
- **Given** historical sales over the past 7 days
- **When** viewing the dashboard
- **Then** the 7-day bar chart renders proportional bar heights for each day
- **And** highlights the current day ("Today") with active accent styling (`.bar.cur`)
- **And** displays hover tooltips/labels with exact daily revenue.

### Scenario 3: Stock on hand matrix table
- **When** inspecting the "Stock on hand" widget
- **Then** a 3x3 grid displays all products (Toyo, Suka, Patis) across all packaging sizes (350ml, 1L, 1gal)
- **With** inline capacity progress meters highlighting low stock items in amber/danger alert token.

### Scenario 4: Urgent notice stream action navigation
- **Given** an overdue notice for "Aling Nena's Sari-Sari Store owes ₱1,340.00"
- **When** the admin clicks "Open sale" on the notice card
- **Then** the application navigates directly to that sale's detail view (`/sales/{id}`).

### Scenario 5: Who owes you debtor ranking & overdue badge
- **Given** multiple customers with outstanding credit balances
- **When** viewing the "Who owes you" widget
- **Then** the top 5 customers with highest debt are displayed sorted by balance descending
- **And** any customer with an unpaid sale exceeding the reminder threshold displays an "Overdue" pill.

### Scenario 6: Zero notices and clear debt empty states
- **Given** an inventory state where all variants exceed minimum stock and all sales are fully paid
- **When** viewing the dashboard
- **Then** Notifications card displays "All clear" with "No overdue balances or low stock."
- **And** "Who owes you" displays "No balances" with "Everyone has paid.".
