# Data Model & Storage Schema: Live Stock Inventory Monitor

**Feature Key**: `ARL-12`  
**Feature Slug**: `009-live-stock-inventory-monitor`  

---

## 1. Relational Entities (PostgreSQL / Supabase)

### Table: `public.product_variants`
Stored in database from `ARL-8` migration `20261105010000_create_products_and_variants_tables.sql`.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique variant ID |
| `product_id` | `UUID` | `NOT NULL REFERENCES products(id) ON DELETE CASCADE` | Parent product FK |
| `size` | `TEXT` | `NOT NULL CHECK (size IN ('350', '1L', 'gal'))` | Packaging size code |
| `cost_price` | `NUMERIC(10, 2)` | `NOT NULL DEFAULT 0.00 CHECK (cost_price >= 0)` | Unit replenishment cost |
| `selling_price` | `NUMERIC(10, 2)` | `NOT NULL DEFAULT 0.00 CHECK (selling_price >= 0)` | Unit retail selling price |
| `stock_quantity` | `INTEGER` | `NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0)` | Current units on hand |
| `min_stock_level` | `INTEGER` | `NOT NULL DEFAULT 0 CHECK (min_stock_level >= 0)` | Minimum warning threshold |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Row creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | Last update timestamp |

### Publication: `supabase_realtime`
- Table `public.product_variants` added to `supabase_realtime` publication to emit row update events to client subscribers.

---

## 2. Domain Models & DTOs (TypeScript)

### `InventoryVariant`
Joined entity model consumed by the inventory monitor UI:

```ts
export type PackagingSize = '350' | '1L' | 'gal';

export interface ProductSummary {
  id: string;
  name: string;
  category_id: string | null;
  category_name?: string | null;
}

export interface InventoryVariant {
  id: string;
  productId: string;
  productName: string;
  categoryName: string | null;
  size: PackagingSize;
  sizeLabel: string; // "350 ml", "1 L", "1 gal"
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  updatedAt: string;
}
```

### `InventoryStatus` & Meter Calculation DTO
```ts
export type StockHealthStatus = 'out-of-stock' | 'low-stock' | 'getting-low' | 'in-stock';
export type BadgeVariant = 'bad' | 'warn' | 'ok';

export interface VariantCapacityEvaluation {
  percentage: number;      // 0 to 100
  isLow: boolean;          // true when stock === 0 or stock <= min_stock_level
  status: StockHealthStatus;
  statusLabel: string;     // "Out of stock" | "Low stock" | "Getting low" | "In stock"
  statusVariant: BadgeVariant;
  shortBy: number;         // Math.max(0, min_stock_level - stock_quantity)
}
```

---

## 3. Realtime Payload Mapping
Incoming `postgres_changes` payload shape:
```ts
export interface RealtimeVariantPayload {
  eventType: 'UPDATE' | 'INSERT' | 'DELETE';
  new: {
    id: string;
    product_id: string;
    size: PackagingSize;
    stock_quantity: number;
    min_stock_level: number;
    updated_at: string;
  };
  old: {
    id: string;
  };
}
```
