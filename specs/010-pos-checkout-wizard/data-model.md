# Data Model & Storage Schema: POS-Style Checkout Wizard

**Feature Key**: `ARL-14`  
**Feature Slug**: `010-pos-checkout-wizard`  

---

## 1. Relational Entities (PostgreSQL / Supabase)

### Table: `public.sales` (Extended)
Created in `20261105020000_create_customers_and_sales_tables.sql`:

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique sale ID |
| `receipt_number` | `TEXT` | `NOT NULL UNIQUE` | Sequential receipt number (`ARLQ-XXXXX`) |
| `customer_id` | `UUID` | `NOT NULL REFERENCES customers(id)` | Buyer / customer |
| `total_amount` | `NUMERIC(10,2)` | `NOT NULL CHECK (total_amount >= 0)` | Grand total revenue |
| `amount_paid` | `NUMERIC(10,2)` | `NOT NULL CHECK (amount_paid >= 0)` | Amount collected |
| `payment_status` | `TEXT` | `NOT NULL CHECK (payment_status IN ('Paid', 'Partially Paid', 'Not Yet Paid'))` | Payment status |
| `order_status` | `TEXT` | `NOT NULL DEFAULT 'Pending' CHECK (order_status IN ('Pending', 'Delivered', 'Picked Up'))` | Delivery status |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Transaction time |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Last update |

### Table: `public.sale_items` (New Migration)
New relational table for individual condiment variant line items:

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique line item ID |
| `sale_id` | `UUID` | `NOT NULL REFERENCES sales(id) ON DELETE CASCADE` | Associated sale |
| `variant_id` | `UUID` | `NOT NULL REFERENCES product_variants(id)` | Condiment size variant |
| `quantity` | `INTEGER` | `NOT NULL CHECK (quantity > 0)` | Bottles purchased |
| `unit_price` | `NUMERIC(10,2)` | `NOT NULL CHECK (unit_price >= 0)` | Snapshot unit retail price |
| `unit_cost` | `NUMERIC(10,2)` | `NOT NULL DEFAULT 0.00 CHECK (unit_cost >= 0)` | Snapshot unit cost price |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Timestamp |

### Table: `public.stock_movements` (Audit Relation)
Created in `20261105030000_create_stock_movements_table.sql`:

- When a sale of quantity `Q` is confirmed for variant `V`:
  - `movement_type`: `'Sale'`
  - `quantity`: `Q`
  - `reason`: `'Sale ' || receipt_number`
  - `note`: `'Sale ' || receipt_number`

---

## 2. Domain Models & DTOs (TypeScript)

### `SaleLineItemInput` & `CreateSaleInput`
```ts
export interface SaleLineItemInput {
  productId: string;
  variantId: string;
  size: '350' | '1L' | 'gal';
  quantity: number;
  unitPrice: number;
  unitCost: number;
}

export interface CreateSaleInput {
  customerId: string;
  lines: SaleLineItemInput[];
  paymentStatus: 'Paid' | 'Partially Paid' | 'Not Yet Paid';
  amountPaid: number;
  orderStatus: 'Pending' | 'Delivered' | 'Picked Up';
}
```

### `SaleCalculationSummary`
```ts
export interface SaleCalculationSummary {
  totalItems: number;
  grossProfit: number;
  grandTotal: number;
  amountPaid: number;
  remainingBalance: number;
  hasStockError: boolean;
  isValid: boolean;
}
```
