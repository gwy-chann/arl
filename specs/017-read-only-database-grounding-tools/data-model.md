# Data Model & Domain Entities: Read-Only Database Grounding Tools

**Feature Key**: `ARL-32`  
**Feature Slug**: `017-read-only-database-grounding-tools`  
**Parent Epic**: `ARL-29` (In-App AI Operational Assistant)  

---

## 1. Domain Entities & Payload Types

### 1.1 `getInventorySummary`

#### Input Schema
```typescript
export interface InventorySummaryInput {
  searchQuery?: string;
  lowStockOnly?: boolean;
}
```

#### Output Payload
```typescript
export interface InventoryVariantItem {
  id: string;
  productName: string;
  variantName: string;
  size: '350 ml' | '1 L' | '1 gal';
  stockQuantity: number;
  minStockLevel: number;
  isLowStock: boolean;
  costPrice: number;
  sellingPrice: number;
  formattedSellingPrice: string; // e.g. "₱50.00"
}

export interface InventorySummaryResult {
  items: InventoryVariantItem[];
  totalVariants: number;
  lowStockCount: number;
}
```

---

### 1.2 `getSalesOverview`

#### Input Schema
```typescript
export type SalesTimeframe = 'today' | 'yesterday' | 'last_7_days' | 'current_month' | 'all';

export interface SalesOverviewInput {
  timeframe: SalesTimeframe;
}
```

#### Output Payload
```typescript
export interface SalesPaymentBreakdown {
  paidCount: number;
  partiallyPaidCount: number;
  notPaidCount: number;
}

export interface SalesOverviewResult {
  timeframe: SalesTimeframe;
  totalSalesCount: number;
  totalGrossRevenue: number;
  formattedGrossRevenue: string; // e.g. "₱4,500.00"
  totalCashCollected: number;
  formattedCashCollected: string; // e.g. "₱3,000.00"
  totalOutstandingBalance: number;
  formattedOutstandingBalance: string; // e.g. "₱1,500.00"
  paymentBreakdown: SalesPaymentBreakdown;
}
```

---

### 1.3 `getCustomerBalances`

#### Input Schema
```typescript
export interface CustomerBalancesInput {
  overdueOnly?: boolean;
  customerName?: string;
}
```

#### Output Payload
```typescript
export interface IndebtedCustomerItem {
  customerId: string;
  name: string;
  phone: string | null;
  totalBalance: number;
  formattedTotalBalance: string; // e.g. "₱1,200.00"
  unpaidTransactionsCount: number;
  oldestUnpaidDays: number;
  isOverdue: boolean;
}

export interface CustomerBalancesResult {
  totalIndebtedCustomers: number;
  totalOutstandingDebt: number;
  formattedOutstandingDebt: string; // e.g. "₱1,200.00"
  customers: IndebtedCustomerItem[];
}
```

---

### 1.4 `getStoreSettings`

#### Input Schema
```typescript
export interface StoreSettingsInput {}
```

#### Output Payload
```typescript
export interface StoreSettingsResult {
  storeName: string;
  overdueReminderDays: number;
  reminderPhone: string;
  defaultMinStockLevel: number;
  smsNotificationEnabled: boolean;
}
```

---

## 2. Gemini Tool Declaration Schema

```typescript
export interface GeminiToolParameterProperty {
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'OBJECT' | 'ARRAY';
  description?: string;
  enum?: string[];
}

export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: 'OBJECT';
    properties: Record<string, GeminiToolParameterProperty>;
    required?: string[];
  };
}

export interface GeminiToolsConfig {
  functionDeclarations: GeminiFunctionDeclaration[];
}
```

---

## 3. Function Call Execution State Machine

```
User Query (e.g. "Which items are low on stock?")
         |
         v
Gemini 2.0 Flash Model Call (tools passed)
         |
         +-------------------------------------+
         |                                     |
         v (Model outputs text directly)       v (Model requests functionCall)
Return Text to User               [Tool Call Dispatcher]
                                  - Validate tool name & args (Zod)
                                  - Execute read-only query
                                  - Return structured tool response
                                               |
                                               v
                                  Recursive Gemini Call
                                  (Content with functionResponse)
                                               |
                                               v
                                  Final Grounded Answer to User
```
