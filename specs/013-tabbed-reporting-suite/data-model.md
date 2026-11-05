# Data Model & Domain Entities: Multi-Dimensional Tabbed Reporting Suite

**Feature Key**: `ARL-20`  
**Feature Slug**: `013-tabbed-reporting-suite`  

---

## 1. Filter State & Dimension Types

```typescript
export type ReportTab =
  | 'sales'
  | 'inventory'
  | 'movement'
  | 'low'
  | 'balances'
  | 'profit';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly';

export type ReportRangeDays = '7' | '30' | '90';

export interface ReportFilterState {
  tab: ReportTab;
  period: ReportPeriod; // for sales
  range: ReportRangeDays; // for movement and profit
  productId: string; // 'all' | UUID
  size: string; // 'all' | '350' | '1L' | 'gal'
}
```

---

## 2. Tabular Analytical Data Transfer Objects (DTOs)

### 2.1 Sales Report DTO
```typescript
export interface SalesReportRow {
  periodLabel: string; // 'Today', 'Yesterday', 'This week', 'October 2026'
  transactionsCount: number;
  bottlesSold: number;
  revenue: number;
  profit: number;
}

export interface SalesReportSummary {
  rows: SalesReportRow[];
  totalTransactions: number;
  totalBottlesSold: number;
  totalRevenue: number;
  totalProfit: number;
}
```

### 2.2 Inventory Valuation DTO
```typescript
export interface InventoryReportRow {
  variantId: string;
  productId: string;
  productName: string;
  size: string;
  sizeLabel: string;
  inStock: number;
  minStock: number;
  costPrice: number;
  sellingPrice: number;
  valueAtCost: number; // inStock * costPrice
  valueAtSellingPrice: number; // inStock * sellingPrice
  status: 'In stock' | 'Low stock' | 'Out of stock';
}

export interface InventoryReportSummary {
  rows: InventoryReportRow[];
  totalUnitsInStock: number;
  totalValueAtCost: number;
  totalValueAtSellingPrice: number;
}
```

### 2.3 Stock Movement DTO
```typescript
export interface MovementReportRow {
  variantId: string;
  productId: string;
  productName: string;
  size: string;
  sizeLabel: string;
  stockIn: number;
  stockOut: number;
  netChange: number; // stockIn - stockOut
  currentStock: number;
}

export interface MovementReportSummary {
  rows: MovementReportRow[];
  rangeDays: number;
}
```

### 2.4 Low Stock DTO
```typescript
export interface LowStockReportRow {
  variantId: string;
  productId: string;
  productName: string;
  size: string;
  sizeLabel: string;
  inStock: number;
  minStock: number;
  shortBy: number; // minStock - inStock
}

export interface LowStockReportSummary {
  rows: LowStockReportRow[];
  totalShortfallUnits: number;
}
```

### 2.5 Customer Balances DTO
```typescript
export interface CustomerBalanceReportRow {
  customerId: string;
  customerName: string;
  unpaidSalesCount: number;
  balance: number;
}

export interface CustomerBalanceReportSummary {
  rows: CustomerBalanceReportRow[];
  totalUnpaidSales: number;
  totalOutstandingBalance: number;
}
```

### 2.6 Earnings & Profit Margin DTO
```typescript
export interface ProfitReportRow {
  variantId: string;
  productId: string;
  productName: string;
  size: string;
  sizeLabel: string;
  bottlesSold: number;
  revenue: number;
  cost: number;
  profit: number; // revenue - cost
  marginPercent: number; // round((profit / revenue) * 100)
}

export interface ProfitReportSummary {
  rows: ProfitReportRow[];
  rangeDays: number;
  totalBottlesSold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  weightedMarginPercent: number; // totalRevenue > 0 ? round((totalProfit / totalRevenue) * 100) : 0
}
```

---

## 3. CSV Export Schema

```typescript
export interface CsvExportOptions {
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  footer?: (string | number)[];
}
```
