# Domain Data Model: Executive Dashboard

**Feature Key**: `ARL-18`  
**Feature Slug**: `013-executive-dashboard`  

---

## 1. Domain Entities & DTOs

### 1.1 Dashboard KPI Metrics (`DashboardKpiDTO`)
Represents the 4 primary operational indicators displayed across the top banner:
```typescript
export interface DashboardKpiDTO {
  sales_today: number;            // Total gross revenue recorded today
  transactions_today: number;     // Number of completed transactions today
  sales_this_month: number;       // Gross revenue recorded during the calendar month
  profit_this_month: number;      // Net profit (selling_price - cost_price) for the month
  outstanding_balances: number;   // Total unpaid utang across all credit sales
  unpaid_sales_count: number;     // Total count of sales with balance > 0
  low_stock_count: number;        // Number of variants currently <= min_stock_level
  total_variants_count: number;   // Total active product variants (e.g. 9 for 3x3)
}
```

### 1.2 7-Day Sales Timeline Chart (`SalesChartDayDTO`)
Represents a single bar column in the 7-day rolling sales visualizer:
```typescript
export interface SalesChartDayDTO {
  day_offset: number;         // 6 (oldest) down to 0 (today)
  date_iso: string;           // ISO date string
  day_label: string;          // "Today" for offset 0; "Mon", "Tue", etc. otherwise
  revenue: number;            // Total gross revenue for that day
  height_percentage: number;  // Proportional bar height 1.5% - 100%
  is_today: boolean;          // True if day_offset === 0
}
```

### 1.3 Stock On Hand Matrix (`StockMatrixRowDTO`)
Represents a row (Product: Toyo, Suka, Patis) and cells (350ml, 1L, 1gal) in the inventory status table:
```typescript
export interface StockMatrixCellDTO {
  variant_id: string;
  size_key: '350' | '1L' | 'gal';
  size_label: string;         // '350 ml', '1 L', '1 gal'
  stock_quantity: number;
  min_stock_level: number;
  capacity_percentage: number;// Math.min(stock / (min * 2.5) * 100, 100)
  is_low: boolean;            // stock_quantity <= min_stock_level
}

export interface StockMatrixRowDTO {
  product_id: string;
  product_name: string;
  category_name?: string;
  variants: StockMatrixCellDTO[];
}
```

### 1.4 Urgent Notice Stream (`UrgentNoticeDTO`)
Represents an action-oriented notification for overdue accounts or depleted inventory:
```typescript
export type UrgentNoticeType = 'overdue_debt' | 'low_stock';

export interface UrgentNoticeDTO {
  id: string;
  type: UrgentNoticeType;
  title: string;              // e.g., "Aling Nena's Sari-Sari Store" or "Toyo - 1 L"
  message: string;            // e.g., "owes ₱1,340.00" or "is running low"
  subtitle: string;           // e.g., "Receipt ARLQ-01041 · unpaid for 9 days · SMS reminder sent"
  badge_tone: 'bad' | 'warn'; // 'bad' for overdue debts, 'warn' for low stock
  action_label: string;       // "Open sale" or "Stock in"
  action_href: string;        // "/sales/{id}" or "/inventory/in"
  created_at: string;
}
```

### 1.5 Who Owes You Debtor Ranking (`CustomerDebtRankingDTO`)
Represents an aggregated customer utang record:
```typescript
export interface CustomerDebtRankingDTO {
  customer_id: string;
  customer_name: string;
  total_debt: number;         // Total outstanding balance across all unpaid sales
  oldest_unpaid_days: number; // Maximum days unpaid among active credit sales
  is_overdue: boolean;        // oldest_unpaid_days >= reminder_days
}
```

### 1.6 Aggregate Dashboard Data Structure (`DashboardDataDTO`)
Complete payload passed to dashboard UI components:
```typescript
export interface DashboardDataDTO {
  kpis: DashboardKpiDTO;
  sales_chart: SalesChartDayDTO[];
  stock_matrix: StockMatrixRowDTO[];
  notices: UrgentNoticeDTO[];
  debt_ranking: CustomerDebtRankingDTO[];
  as_of: string;
}
```
