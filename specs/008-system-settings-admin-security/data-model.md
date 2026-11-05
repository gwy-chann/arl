# Data Model & Storage Specifications: System Settings & Security

**Feature Key**: `ARL-21`  
**Feature Slug**: `008-system-settings-admin-security`  

---

## 1. Relational Entities

### 1.1 `public.system_settings` Table

Stores global store operational parameters.

```sql
CREATE TABLE IF NOT EXISTS public.system_settings (
    id TEXT PRIMARY KEY DEFAULT 'singleton_store_settings',
    reminder_days INTEGER NOT NULL DEFAULT 7 CHECK (reminder_days >= 1),
    admin_mobile TEXT NOT NULL DEFAULT '0917 555 0142',
    notification_channel TEXT NOT NULL DEFAULT 'SMS',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT single_row_check CHECK (id = 'singleton_store_settings')
);
```

### 1.2 `public.product_variants` (Reference to Existing Schema)

Batch updates target the `min_stock_level` column:

```sql
-- Existing definition in 20261105010000_create_products_and_variants_tables.sql:
-- min_stock_level INTEGER NOT NULL DEFAULT 0 CHECK (min_stock_level >= 0)
```

Batch update payload:
```typescript
export interface BatchVariantMinStockItem {
  variant_id: string;
  min_stock_level: number;
}
```

---

## 2. In-Memory Domain Model (for tests and SSR fallback)

```typescript
export interface SystemSettingsDTO {
  id: string;
  reminder_days: number;
  admin_mobile: string;
  notification_channel: string;
  updated_at: string;
}

export interface StockMatrixVariantDTO {
  variant_id: string;
  product_id: string;
  product_name: string;
  size: '350' | '1L' | 'gal';
  stock_quantity: number;
  min_stock_level: number;
  is_low_stock: boolean;
}

export interface StockMatrixProductDTO {
  product_id: string;
  product_name: string;
  variants: Record<'350' | '1L' | 'gal', StockMatrixVariantDTO>;
}
```

---

## 3. State Machine & Overdue Computation

A sale record is considered `Overdue` when:
$$\text{is\_overdue} = (\text{total\_amount} > \text{amount\_paid}) \land (\text{days\_elapsed} \ge \text{reminder\_days})$$

A variant is considered `Low Stock` when:
$$\text{is\_low\_stock} = \text{stock\_quantity} \le \text{min\_stock\_level}$$
