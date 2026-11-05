# Implementation Plan: Multi-Dimensional Tabbed Reporting Suite with CSV/Print Export

**Feature Key**: `ARL-20`  
**Feature Slug**: `013-tabbed-reporting-suite`  
**Jira Story**: STORY-4.3: Multi-Dimensional Tabbed Reporting Suite with CSV/Print Export  
**Status**: Ready for Implementation  

---

## 1. Technical Context & Architecture Overview

The multi-dimensional reporting suite allows ARLQ store administrators to audit business health, sales revenue, gross profits, stock turnover velocity, valuation, and customer debts across 6 interconnected tabs with instant client-side filtering, CSV export, and print-ready stylesheets.

### Architectural Component Diagram:

```
app/(admin)/reports/
  ├── layout.tsx                (Page title, breadcrumbs, ReportTabs bar)
  ├── page.tsx                  (Redirects to /reports/sales)
  ├── sales/page.tsx            (Sales report view with period & variant filters)
  ├── inventory/page.tsx        (Inventory valuation view at cost vs selling price)
  ├── movement/page.tsx         (Stock-in vs stock-out movement velocity view)
  ├── low/page.tsx              (Low stock alert and replenishment shortfall view)
  ├── balances/page.tsx         (Customer debt balances and unpaid sale count view)
  └── profit/page.tsx           (Earnings, profit margin %, and weighted totals view)

components/reports/
  ├── report-tabs.tsx           (Responsive 6-tab navigation matching mockup)
  ├── report-toolbar.tsx        (Dynamic filter dropdowns: period, range, product, size, Print, CSV)
  ├── sales-report-view.tsx     (Sales report interactive table and totals)
  ├── inventory-report-view.tsx (Inventory valuation interactive table and totals)
  ├── movement-report-view.tsx  (Stock movement ledger summary table)
  ├── low-stock-report-view.tsx (Low stock exceptions table)
  ├── balances-report-view.tsx  (Customer balances debt table)
  └── profit-report-view.tsx    (Profit margin table with weighted percentage footer)

lib/reports/
  ├── report-contracts.ts       (TypeScript types, Zod schemas, filter state)
  ├── report-service.ts         (Pure domain math & aggregation engines)
  └── csv-export.ts             (RFC 4180 CSV builder & browser download utility)
```

---

## 2. Design System & Token Compliance

In accordance with `AGENTS.md` and `lib/tokens.ts`:
- **Card container**: `bg-bg-surface border border-border rounded-lg shadow-xs`
- **Toolbar**: `flex flex-wrap items-center gap-2.5 p-3.5 border-b border-border bg-bg-muted/30`
- **Tables**: `w-full text-sm text-left border-collapse`, with `thead` having `bg-bg-muted text-text-muted font-medium text-xs uppercase tracking-wider`
- **Numbers**: `text-right tabular-nums font-mono`
- **Danger highlight**: `text-danger font-semibold`
- **Print rules**: `@media print` cleanly hides sidebar, topbar, tabs, and action toolbar (`.no-print`).

---

## 3. Test Strategy

1. **Unit Tests (`tests/reports.test.ts`)**:
   - Math aggregation tests:
     - Sales period bucketing (daily 7 days, weekly 4 weeks, monthly 3 months)
     - Product and size filter matching
     - Inventory valuation at cost (`stock * cost`) and selling price (`stock * price`)
     - Stock movement aggregation (In vs Out vs Net change over 7, 30, 90 days)
     - Low stock filtering and short-by calculations
     - Customer balances ordering and debt summation
     - Earnings and gross profit calculations (`revenue - cost`)
     - Overall weighted margin percentage calculation (`round(total_profit / total_revenue * 100)`)
     - Edge cases: 0 sales, 0 revenue, empty inventory
   - CSV export generation:
     - RFC 4180 escaping (commas, quotes)
     - Column header and row alignment
2. **Integration Verification**:
   - Build compilation (`npm run build`)
   - Linter verification (`npm run lint`)
   - Regression verification of existing 145 tests (`npm test`)
