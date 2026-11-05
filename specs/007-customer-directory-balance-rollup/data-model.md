# Data Model: Customer Directory & Live Balance Rollup

**Feature Key**: `ARL-9`  
**Feature Slug**: `007-customer-directory-balance-rollup`  

---

## 1. Relational Entities (PostgreSQL / Supabase)

### `public.customers`
Master directory of commercial and individual buyers.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique customer identifier |
| `name` | `TEXT` | `NOT NULL` | Store or individual name (e.g., "Aling Nena's Sari-Sari Store") |
| `phone` | `TEXT` | `NOT NULL` | Mobile or landline contact number (e.g., "0917 301 4488") |
| `address` | `TEXT` | `NOT NULL DEFAULT ''` | Physical delivery or stall address |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Last update timestamp |

### `public.sales`
Sales transactions linked to customers for purchase counts and debt rollups.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique transaction identifier |
| `receipt_number` | `TEXT` | `NOT NULL UNIQUE` | Sequential receipt code (e.g., `ARLQ-01041`) |
| `customer_id` | `UUID` | `NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT` | Customer reference |
| `total_amount` | `NUMERIC(10,2)` | `NOT NULL CHECK (total_amount >= 0)` | Grand total in PHP |
| `amount_paid` | `NUMERIC(10,2)` | `NOT NULL CHECK (amount_paid >= 0)` | Amount paid in PHP |
| `payment_status` | `TEXT` | `NOT NULL CHECK (payment_status IN ('Paid', 'Partially Paid', 'Not Yet Paid'))` | Payment state |
| `order_status` | `TEXT` | `NOT NULL DEFAULT 'Pending' CHECK (order_status IN ('Pending', 'Delivered', 'Picked Up'))` | Order fulfillment state |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Transaction timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Last update timestamp |

---

## 2. TypeScript Domain Models & DTOs

```typescript
export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerWithRollup extends Customer {
  purchase_count: number;
  debt_balance: number;
}

export interface SaleSummary {
  id: string;
  receipt_number: string;
  customer_id: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  payment_status: 'Paid' | 'Partially Paid' | 'Not Yet Paid';
  order_status: 'Pending' | 'Delivered' | 'Picked Up';
  created_at: string;
}

export interface CustomerProfileData extends Customer {
  debt_balance: number;
  purchase_count: number;
  sales: SaleSummary[];
}
```

---

## 3. Balance Rollup Business Invariants

- Total Customer Debt:
  $$\text{debt\_balance} = \sum_{s \in \text{sales}} \max(0, s.\text{total\_amount} - s.\text{amount\_paid})$$
- Purchase Count:
  $$\text{purchase\_count} = |\text{sales}_{c}|$$
- Zero Debt:
  $$\text{debt\_balance} \le 0 \implies \text{display} = \text{"-"}$$
- Positive Debt:
  $$\text{debt\_balance} > 0 \implies \text{display} = \text{formatPeso}(\text{debt\_balance}) \text{ in var(--bad) / text-danger}$$
