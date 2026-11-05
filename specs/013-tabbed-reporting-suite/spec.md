# Feature Specification: Multi-Dimensional Tabbed Reporting Suite with CSV/Print Export

**Feature Key**: `ARL-20`  
**Feature Slug**: `013-tabbed-reporting-suite`  
**Jira Story**: STORY-4.3: Multi-Dimensional Tabbed Reporting Suite with CSV/Print Export  
**Epic**: EPIC-4: Business Intelligence, Analytics & Financial Reporting (`ARL-17`)  
**Status**: Ready for Planning  

---

## 1. User Story

**As an** ARLQ store administrator,  
**I want to** access a multi-tabbed reports center covering Sales, Inventory valuation, Movement, Low stock, Balances, and Profit margins with dynamic toolbar filtering, CSV download, and print-ready layouts,  
**so that** I can analyze gross margins, monitor stock health, track receivables, and export analytical reports for physical filing or offline spreadsheet analysis.

---

## 2. Business Invariants & Domain Rules

1. **Tabbed Architecture & Routes**:
   - The reports module is located under `/reports` with sub-routes for each analytical dimension:
     - `/reports/sales` (Sales activity aggregate buckets: daily, weekly, monthly)
     - `/reports/inventory` (Live warehouse inventory valuation at cost vs selling price)
     - `/reports/movement` (Stock-in vs stock-out movement velocity over time windows)
     - `/reports/low` (Low stock alert exceptions and replenishment shortages)
     - `/reports/balances` (Customer outstanding receivables rollup and unpaid order counts)
     - `/reports/profit` (Earnings, gross profits, and profit margin percentages per product variant)
   - Navigating to `/reports` directly redirects cleanly to the default tab `/reports/sales`.
   - The global Reports navigation link in the administrative sidebar remains highlighted as active across all `/reports/*` sub-routes.

2. **Dynamic Filter Toolbar Slicing**:
   - Every report tab features a consistent top toolbar (`.toolbar`) containing responsive filter controls and action buttons:
     - **Sales Report**: `Period` (`daily`: Daily last 7 days, `weekly`: Weekly last 4 weeks, `monthly`: Monthly last 3 months), `Product` (All products or specific product), `Size` (All sizes or 350ml, 1L, 1gal).
     - **Inventory Report**: `Product` filter, `Size` filter.
     - **Stock Movement Report**: `Range` (`7`: Last 7 days, `30`: Last 30 days, `90`: Last 90 days), `Product` filter, `Size` filter.
     - **Low Stock Report**: `Product` filter, `Size` filter.
     - **Customer Balances Report**: Unfiltered or summary toolbar with action buttons.
     - **Earnings & Profit Report**: `Range` (`7`, `30`, `90` days), `Product` filter, `Size` filter.
   - Filters update tabular calculations instantly on change without page reloads.

3. **Mathematical Formulas & Analytical Invariants**:
   - **Sales Report**:
     - `Bottles sold`: sum of line item quantities matching active product/size filters within the period bucket.
     - `Sales (Revenue)`: sum of `(quantity * unit_price)` for matching items.
     - `Profit`: sum of `(quantity * (unit_price - unit_cost))` for matching items.
     - Footer Total Row: sum of transactions, total bottles sold, total sales revenue, total profit.
   - **Inventory Valuation Report**:
     - `Value at cost`: `stock_quantity * cost_price`.
     - `Value at selling price`: `stock_quantity * selling_price`.
     - `Potential Margin`: `Value at selling price - Value at cost`.
     - Footer Total Row: total units in stock, total warehouse valuation at cost, total warehouse valuation at selling price.
   - **Stock Movement Report**:
     - `Stock in`: sum of inbound stock movements (`movement_type = 'In'`) for the variant within the selected day range.
     - `Stock out`: sum of outbound stock movements (`movement_type = 'Out'`) within the range.
     - `Net change`: `Stock in - Stock out`. Formatted with explicit sign prefix (`+` or `-`).
     - `Now in stock`: current live stock quantity of the variant.
   - **Low Stock Report**:
     - Lists only variants where `stock_quantity <= min_stock_level`.
     - `Short by`: `min_stock_level - stock_quantity`.
     - Stock count highlighted with semantic danger token (`text-danger`).
     - When no variants are below minimum, renders empty state banner: "Nothing to report: No variants are below the minimum for this filter."
   - **Customer Balances Report**:
     - Lists all customers with outstanding debt (`total_receivable > 0`), ordered by balance descending.
     - `Unpaid sales`: count of sales for the customer with `balance > 0`.
     - `Balance`: total remaining unpaid balance across all customer sales.
     - Footer Total Row: total unpaid sales count, total outstanding debt across all accounts.
     - When all accounts are settled, displays empty state: "No balances: Every customer is fully paid."
   - **Earnings & Profit Margin Report**:
     - Evaluates sales within the selected range (7, 30, or 90 days).
     - `Bottles Sold`: total units sold for variant.
     - `Revenue`: total gross revenue (`sum(quantity * unit_price)`).
     - `Cost`: total cost of goods sold (`sum(quantity * unit_cost)`).
     - `Profit`: `Revenue - Cost`.
     - `Margin %`: `round((Profit / Revenue) * 100)%`.
     - Footer Total Row: total bottles sold, total revenue, total cost, total profit, and weighted aggregate margin: `total_revenue > 0 ? round((total_profit / total_revenue) * 100) : 0%`.
     - Excludes variants with 0 sales in the selected period. If no sales occurred, renders: "No sales in this range: Try a longer range or another product."

4. **CSV Analytical Export**:
   - Clicking "Export CSV" dynamically compiles the current filtered dataset into an RFC 4180 compliant CSV document.
   - Includes column headers, data rows, and summary total rows.
   - Numbers and currency amounts are clean, unescaped numerical values suitable for Excel / Google Sheets calculation.
   - Triggers automatic browser file download named `arlq-<tab>-report-<timestamp>.csv`.

5. **Print-Ready Formatting (`@media print`)**:
   - Clicking "Print report" invokes native browser `window.print()`.
   - The print stylesheet strips all administrative UI (sidebar navigation, top header, breadcrumbs, search bars, filter dropdowns, and buttons with `.no-print`).
   - Tables expand cleanly to 100% paper width with high-contrast text, clear borders, and readable tabular numbers (`tabular-nums font-mono`).
   - Prevents page breaks within table rows (`break-inside: avoid`).

6. **Design System & Zero Hardcoded Colors**:
   - Complies strictly with `AGENTS.md` and `lib/tokens.ts`.
   - Utilizes semantic classes (`bg-bg-surface`, `border-border`, `text-text-primary`, `text-text-muted`, `bg-primary`, `bg-secondary`, `text-danger`).
   - Supports seamless light and dark mode toggling.

---

## 3. Acceptance Criteria & Gherkin Scenarios

### Scenario 1: Earnings & profit margin breakdown
- **Given** historical sales recorded across Toyo, Suka, and Patis
- **When** the admin navigates to the "Earnings and profit" report (`/reports/profit`)
- **Then** each variant row displays: Bottles Sold, Revenue, Cost, Profit (`revenue - cost`), and Margin %
- **And** the footer total row accurately calculates total revenue, total cost, total profit, and overall weighted profit margin %.

### Scenario 2: Dynamic filter toolbar slicing
- **Given** the Sales report view (`/reports/sales`)
- **When** the admin selects Period "Monthly (last 3 months)" and Product "Toyo" (Soy sauce)
- **Then** the data table instantly refreshes to display monthly aggregate buckets for Soy sauce only
- **And** aggregate bottles sold, sales, and profit reflect only the filtered product.

### Scenario 3: Inventory valuation by cost vs selling price
- **When** viewing the "Inventory" report (`/reports/inventory`)
- **Then** the table lists all variants with "Value at cost" (`stock * cost`) and "Value at selling price" (`stock * price`)
- **And** the footer summarizes total warehouse inventory valuation at cost and total valuation at selling price.

### Scenario 4: Print-ready report formatting
- **Given** any report view with active filters
- **When** the admin clicks "Print report"
- **Then** `window.print()` is invoked
- **And** the print layout formats cleanly without sidebar, topbar, filter dropdowns, or action buttons, optimized for physical print and PDF export.

### Scenario 5: CSV data export
- **Given** any filtered report view
- **When** the admin clicks "Export CSV"
- **Then** an RFC 4180 compliant CSV file is generated matching the current view data and downloaded with filename `arlq-<tab>-report-<date>.csv`.

### Scenario 6: Customer balances debt audit
- **When** viewing the "Customer balances" report (`/reports/balances`)
- **Then** all customers with outstanding balances are listed sorted by balance descending
- **And** the footer displays total unpaid sales count and total outstanding debt across all accounts.

### Scenario 7: Stock movement velocity audit
- **When** viewing the "Stock movement" report (`/reports/movement`) with Range "Last 30 days"
- **Then** each variant displays total inbound stock (`+In`), outbound stock (`-Out`), net change, and live stock on hand.

---

## 4. Key Entities & Domain Types

- **`ReportPeriod`**: `'daily' | 'weekly' | 'monthly'`
- **`ReportRange`**: `'7' | '30' | '90'`
- **`ReportTab`**: `'sales' | 'inventory' | 'movement' | 'low' | 'balances' | 'profit'`
- **`SalesReportRow`**: `{ periodLabel: string, transactionsCount: number, bottlesSold: number, revenue: number, profit: number }`
- **`InventoryReportRow`**: `{ variantId: string, productName: string, size: string, inStock: number, minStock: number, valueAtCost: number, valueAtSellingPrice: number, status: 'In stock' | 'Low stock' | 'Out of stock' }`
- **`MovementReportRow`**: `{ variantId: string, productName: string, size: string, stockIn: number, stockOut: number, netChange: number, currentStock: number }`
- **`LowStockReportRow`**: `{ variantId: string, productName: string, size: string, inStock: number, minStock: number, shortBy: number }`
- **`CustomerBalanceReportRow`**: `{ customerId: string, customerName: string, unpaidSalesCount: number, balance: number }`
- **`ProfitReportRow`**: `{ variantId: string, productName: string, size: string, bottlesSold: number, revenue: number, cost: number, profit: number, marginPercent: number }`

---

## 5. Success Criteria

1. **Analytical Accuracy**: 100% mathematical fidelity in revenue, cost of goods, net change, and weighted gross margin rollups matching test fixtures.
2. **Interactive Slicing Latency**: Filter adjustments (product, size, period, date range) re-compute views in < 50ms without network roundtrips.
3. **Zero Hardcoded Colors**: Full compliance with ARLQ design token system (`lib/tokens.ts`).
4. **Print & CSV Fidelity**: Print view renders 0 administrative UI chrome; CSV export validates against standard RFC 4180 parsers.
