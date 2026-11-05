# Technical Implementation Plan: Executive Dashboard

**Feature Key**: `ARL-18`  
**Feature Slug**: `013-executive-dashboard`  
**Jira Story**: STORY-4.1: Executive Dashboard with KPI Cards, Sales Chart & Urgent Notices  

---

## 1. Technical Architecture & Component Tree

```text
app/(admin)/dashboard/page.tsx (Server Component)
└── <div className="space-y-6">
    ├── <DashboardHeader date={currentDate} />
    ├── <DashboardKpiCards kpis={data.kpis} />
    └── <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-5 items-start">
        ├── <div className="flex flex-col gap-5">
        │   ├── <DashboardUrgentNotices notices={data.notices} />
        │   └── <DashboardSalesChart chart={data.sales_chart} />
        └── <div className="flex flex-col gap-5">
            ├── <DashboardStockMatrix matrix={data.stock_matrix} />
            └── <DashboardDebtRanking ranking={data.debt_ranking} />
```

---

## 2. Proposed Modules & Files

1. **Domain Service & Calculations**:
   - `lib/dashboard/dashboard-contracts.ts`: DTO interfaces and helper formatting utilities.
   - `lib/dashboard/dashboard-service.ts`: Core data aggregation querying sales, inventory, and debt rollups with deterministic `asOfDate` support for testability.

2. **UI Presentation Components (`components/dashboard/`)**:
   - `dashboard-header.tsx`: Date salutation and quick action buttons (`+ New sale`, `Stock in`).
   - `dashboard-kpi-cards.tsx`: Responsive 4-card metric grid (`Sales today`, `Sales this month`, `Outstanding balances`, `Low stock items`) using semantic alert tokens when thresholds are tripped.
   - `dashboard-sales-chart.tsx`: Pure CSS 7-day bar chart with active today styling (`.bar.cur`) and formatted monetary tooltips/em elements.
   - `dashboard-stock-matrix.tsx`: 3×3 condiment inventory matrix with inline capacity progress meters highlighting low stock items.
   - `dashboard-urgent-notices.tsx`: Unified stream combining overdue customer debt and low stock alerts with direct navigation actions.
   - `dashboard-debt-ranking.tsx`: "Who owes you" top 5 debtors list with overdue badges.

3. **Page Route Integration**:
   - `app/(admin)/dashboard/page.tsx`: Replace legacy session placeholder with complete operational executive dashboard.

4. **Automated Testing Suite**:
   - `tests/dashboard.test.ts`: Node test runner verifying calculation of KPIs, 7-day sales buckets, stock matrix capacity formulas, notice generation, and navigation links.

---

## 3. Design System & CSS Token Mapping

All styles map strictly to design system tokens (`app/globals.css`, `lib/tokens.ts`):
- Background surfaces: `bg-bg-surface`, `bg-bg-card`, `bg-bg-muted`
- Text typography: `text-text-primary`, `text-text-secondary`, `text-text-muted`
- Brand indicators: `bg-primary`, `text-primary`, `hover:bg-primary-hover`
- Alert indicators:
  - Danger (overdue / alert): `text-danger`, `bg-danger`, `bg-danger-light`, `border-danger-border`
  - Warning (low stock): `text-accent`, `bg-accent`, `bg-accent-light`, `border-accent-border`
- Borders: `border-border`, `border-border-subtle`
- Zero arbitrary hex values or unmapped Tailwind palettes.
