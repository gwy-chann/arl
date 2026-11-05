# Data Model & Storage Schema: Sales Ledger, Detail View & Status Manager

**Feature Key**: `ARL-15`  
**Feature Slug**: `011-sales-ledger-detail-status-manager`  

---

## 1. Relational Entities (PostgreSQL / Supabase)

### Table: `public.sales`
Created in `20261105020000_create_customers_and_sales_tables.sql`:

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique sale transaction identifier |
| `receipt_number` | `TEXT` | `NOT NULL UNIQUE` | Sequential receipt code (`ARLQ-XXXXX`) |
| `customer_id` | `UUID` | `NOT NULL REFERENCES customers(id)` | Customer / buyer |
| `total_amount` | `NUMERIC(10,2)` | `NOT NULL CHECK (total_amount >= 0)` | Grand total amount |
| `amount_paid` | `NUMERIC(10,2)` | `NOT NULL CHECK (amount_paid >= 0)` | Total payment collected |
| `payment_status` | `TEXT` | `NOT NULL CHECK (payment_status IN ('Paid', 'Partially Paid', 'Not Yet Paid'))` | Current settlement status |
| `order_status` | `TEXT` | `NOT NULL DEFAULT 'Pending' CHECK (order_status IN ('Pending', 'Delivered', 'Picked Up'))` | Current delivery status |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Transaction timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Last update timestamp |

### Table: `public.sale_items`
Created in `20261105060000_create_sale_items_table.sql`:

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique line item identifier |
| `sale_id` | `UUID` | `NOT NULL REFERENCES sales(id) ON DELETE CASCADE` | Associated sale record |
| `variant_id` | `UUID` | `NOT NULL REFERENCES product_variants(id)` | Purchased size variant |
| `quantity` | `INTEGER` | `NOT NULL CHECK (quantity > 0)` | Quantity purchased |
| `unit_price` | `NUMERIC(10,2)` | `NOT NULL CHECK (unit_price >= 0)` | Snapshot retail selling price |
| `unit_cost` | `NUMERIC(10,2)` | `NOT NULL DEFAULT 0.00 CHECK (unit_cost >= 0)` | Snapshot unit cost price |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Creation timestamp |

### Table: `public.system_settings`
Created in `20261105040000_create_system_settings_table.sql`:

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | `PRIMARY KEY DEFAULT 'singleton_store_settings'` | Singleton identifier |
| `reminder_days` | `INTEGER` | `NOT NULL DEFAULT 7 CHECK (reminder_days >= 1)` | Days unpaid threshold before overdue alert |
| `admin_mobile` | `TEXT` | `NOT NULL DEFAULT '0917 555 0142'` | Mobile number notified via SMS |
| `notification_channel`| `TEXT` | `NOT NULL DEFAULT 'SMS'` | SMS notification channel |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Last updated timestamp |

---

## 2. TypeScript Domain Models & Contracts

### Payment & Order Enums
```ts
export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Not Yet Paid';
export type OrderStatus = 'Pending' | 'Delivered' | 'Picked Up';
```

### Sale Item DTO
```ts
export interface SaleLineItemDTO {
  id: string;
  sale_id: string;
  variant_id: string;
  product_name?: string;
  size?: '350' | '1L' | 'gal';
  quantity: number;
  unit_price: number;
  unit_cost: number;
  created_at: string;
}
```

### Sale Transaction Detail DTO
```ts
export interface SaleDetailDTO {
  id: string;
  receipt_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  items: SaleLineItemDTO[];
  gross_profit: number;
  created_at: string;
  updated_at: string;
  days_unpaid: number;
  is_overdue: boolean;
  days_overdue: number;
}
```

### Status Update Payloads
```ts
export interface UpdateSalePaymentInput {
  saleId: string;
  paymentStatus: PaymentStatus;
  amountPaid?: number;
}

export interface UpdateSaleOrderStatusInput {
  saleId: string;
  orderStatus: OrderStatus;
}
```
