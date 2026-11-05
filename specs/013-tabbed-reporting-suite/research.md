# Research & Architecture Decisions: Multi-Dimensional Tabbed Reporting Suite

**Feature Key**: `ARL-20`  
**Feature Slug**: `013-tabbed-reporting-suite`  

---

## 1. Technical Stack Constraints & Architecture

1. **Next.js 16 App Router & Route Structure**:
   - The reports module resides under `app/(admin)/reports/`.
   - `app/(admin)/reports/layout.tsx`:
     - Renders standard page header ("Reports" with subtitle "Filter by product and size, then print or export.")
     - Renders persistent report tabs bar (`ReportTabs`) linking to the 6 analytical views:
       - `/reports/sales` (Sales)
       - `/reports/inventory` (Inventory)
       - `/reports/movement` (Stock movement)
       - `/reports/low` (Low stock)
       - `/reports/balances` (Customer balances)
       - `/reports/profit` (Earnings and profit)
     - `app/(admin)/reports/page.tsx` performs a clean `redirect('/reports/sales')`.
   - Each sub-route hosts its dedicated page component consuming the shared reports service and rendering tab-specific analytical tables.

2. **Computation Architecture (Client-Side Filtering with Server Pre-Fetching)**:
   - To deliver the instantaneous (<50ms) filter response demonstrated in `mockup/app.js` (`A.rset` reacting immediately on change):
     - The report views can load data from the database services (`ProductService`, `SaleService`, `StockService`, `CustomerService`) and compute aggregated metrics client-side.
     - Pure functional aggregation methods are encapsulated in `lib/reports/report-service.ts` so they can be unit-tested in isolation (with 100% test coverage) and reused on both server and client.

3. **Domain Aggregation Formulas**:
   - **Sales Bucketing**:
     - `daily`: 7 buckets (Today, Yesterday, ..., 6 days ago).
     - `weekly`: 4 buckets (This week, Last week, 2 weeks ago, 3 weeks ago).
     - `monthly`: 3 buckets (This month, Last month, 2 months ago).
     - Filters by `variant_id` matching selected product ID and size.
   - **Inventory Valuation**:
     - `cost_valuation = stock_quantity * cost_price`
     - `retail_valuation = stock_quantity * selling_price`
     - `status`: `'In stock' | 'Low stock' | 'Out of stock'`
   - **Stock Movements**:
     - Evaluates movements within last N days (`7`, `30`, `90`).
     - Sum of `quantity` where `movement_type = 'In'`.
     - Sum of `quantity` where `movement_type = 'Out'`.
     - `net_change = inbound - outbound`.
   - **Earnings & Profit**:
     - For each variant with sales within the selected range (`7`, `30`, `90` days):
       - `revenue = sum(item.quantity * item.unit_price)`
       - `cost = sum(item.quantity * item.unit_cost)`
       - `profit = revenue - cost`
       - `margin_pct = revenue > 0 ? round((profit / revenue) * 100) : 0`
     - Footer summary totals and weighted margin: `round((total_profit / total_revenue) * 100)`.

4. **CSV Export Engine (`lib/reports/csv-export.ts`)**:
   - RFC 4180 standard compliant CSV generation.
   - Handles escaping of commas, quotes, and newlines (`"value"`).
   - Generates client-side blob `new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })` and initiates download via temporary anchor element.
   - Fallback-safe for node environments (returns raw CSV string for unit test verification).

5. **Print Layout Rules (`@media print`)**:
   - The mockup uses `window.print()` triggered from `.toolbar button`.
   - All print layouts must hide:
     - Sidebar (`#sidebar`, `aside`)
     - Top navigation bar (`header`)
     - Breadcrumbs (`nav[aria-label="Breadcrumb"]`)
     - Report tabs bar (`.tabs`, `nav[aria-label="Report tabs"]`)
     - Filter toolbar and action buttons (`.toolbar`, `.no-print`)
     - Toast notifications (`#toast-container`)
   - Reports render in pure white background with sharp black text, borders, and no-break rows (`break-inside: avoid`).

6. **Design System & Styling**:
   - Strictly conforms to `AGENTS.md` zero hardcoded color directive.
   - Uses `lib/tokens.ts` semantic tokens.
   - All tables wrapped in `.tbl-wrap` matching mockup.
   - Numbers aligned right with `text-right tabular-nums font-mono`.
