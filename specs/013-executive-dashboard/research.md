# Technical Research & Architecture Decisions: Executive Dashboard

**Feature Key**: `ARL-18`  
**Feature Slug**: `013-executive-dashboard`  
**Epic**: `EPIC-4: Analytics, Dashboard & Reporting` (`ARL-17`)  

---

## 1. Stack Alignment & Context

- **Framework**: Next.js 16 (App Router) with React 19 Server Components for data fetching and light Client Components where client interaction is beneficial.
- **Styling**: Tailwind CSS v4 consuming semantic tokens (`app/globals.css`, `lib/tokens.ts`, zero hardcoded hex/RGB).
- **Single Source of Truth**:
  - `mockup/index.html` & `mockup/app.js` lines 275–313 (`dashboard()`).
  - `mockup/styles.css` lines 301–338 (`.stats`, `.stat`, `.dash-grid`, `.notice`, `.bars`, `.bar`, `.stockgrid`, `.meter`, `.rowlist`).

---

## 2. Architectural Analysis & Key Decisions

### Decision 1: Aggregated Dashboard Service Architecture
- **Problem**:
  The dashboard needs data spanning multiple domains: sales transactions (today and monthly metrics, 7-day timeline), inventory variants (stock matrix, low stock count), customer debt balances, and overdue notification alerts.
- **Decision**:
  - Implement `DashboardService` (`lib/dashboard/dashboard-service.ts`) which composes `SaleService`, `ProductService`, `StockService`, and `CustomerService`.
  - Provide a single unified `getDashboardData()` method returning typed DTOs:
    - `kpis`: `sales_today`, `transactions_today`, `sales_this_month`, `profit_this_month`, `outstanding_balances`, `unpaid_sales_count`, `low_stock_count`, `total_variants_count`.
    - `sales_chart`: array of 7 day buckets `{ day_index, label, date, amount, height_percentage, is_today }`.
    - `stock_matrix`: array of products with their 3 packaging variants (350ml, 1L, 1gal) containing stock quantity, min threshold, capacity percentage, and is_low flag.
    - `notices`: array of combined overdue utang notices and low-stock alerts sorted by urgency.
    - `debt_ranking`: top 5 debtor customers with total utang, oldest unpaid days, and overdue status.

### Decision 2: Pure CSS 7-Day Visualizer Chart
- **Problem**:
  The mockup uses clean, lightweight HTML/CSS bars (`.bars` and `.bar`) rather than heavy charting libraries (e.g. Chart.js, Recharts) that bloat bundle size and introduce client hydrations.
- **Decision**:
  - Render pure CSS bar columns with flexbox alignment (`items-end`).
  - Compute each day's bar height percentage: `Math.max(dayAmount / maxDailyAmount * 100, 1.5)%`.
  - Day 0 is marked with `.bar.cur` (brand background token).
  - Hover or static `<em>` elements render formatted currency figures `₱X,XXX`.

### Decision 3: 3×3 Stock On Hand Matrix
- **Problem**:
  The dashboard must present Toyo, Suka, and Patis alongside their three sizes (350 ml, 1 L, 1 gal) with visual capacity meters.
- **Decision**:
  - Fetch products and group variants by standard packaging keys (`350`, `1L`, `gal`).
  - Inline progress meter: `Math.min(stock / (min * 2.5) * 100, 100)%`.
  - When `stock <= min`, progress bar renders with warning/danger status token.

### Decision 4: Urgent Notice Stream and Navigation Actions
- **Problem**:
  Admins must be able to act on issues directly from the dashboard:
  - Overdue debt notice must immediately link to `/sales/{id}`.
  - Low stock notice must immediately link to `/inventory/in`.
- **Decision**:
  - Overdue sales are flagged when `balance > 0` and `days_unpaid >= reminder_days` (default 7 days).
  - Low stock variants are flagged when `stock_quantity <= min_stock_level`.
  - Notices are rendered as semantic cards with dot status indicators (`.dot.bad` for overdue, `.dot.warn` for low stock) and direct action buttons.

### Decision 5: Test-First Domain Logic Isolation
- **Problem**:
  Dashboard computations (today sales filtering, 7-day rolling buckets, profit calculations, capacity meter percentages) must be deterministic and verifiable without needing an active database connection.
- **Decision**:
  - Pure calculation functions in `lib/dashboard/dashboard-service.ts` accept an optional `asOfDate` parameter to permit exact date mocking in unit tests.
  - Comprehensive unit and integration test suite in `tests/dashboard.test.ts` verifying all scenarios from Jira ARL-18 acceptance criteria.
