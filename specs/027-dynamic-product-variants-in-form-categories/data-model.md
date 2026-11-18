# Data Model & Storage Specifications: In-Form Category Creation & Dynamic Product Variant Management

**Feature Key**: `ARL-38`  
**Feature Slug**: `027-dynamic-product-variants-in-form-categories`  
**Epic**: EPIC-2: Core Domain Entities & Primary CRUD Operations (`ARL-6`)  

---

## 1. Entities & Domain Models

### Entity: Product
Represents the parent condiment product.

| Field | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` (string) | No | `gen_random_uuid()` | Unique product identifier |
| `name` | `string` | No | - | Product display name (e.g., "Toyo", "Suka", "Patis", "Cooking Oil") |
| `category_id` | `UUID` (string) | **Yes** | `NULL` | Foreign key referencing `categories.id` (`ON DELETE SET NULL`) |
| `created_at` | `string` (ISO-8601) | No | `now()` | Product creation timestamp |
| `updated_at` | `string` (ISO-8601) | No | `now()` | Product last update timestamp |

---

### Entity: ProductVariant
Represents an individual sellable SKU packaging size for a product with pricing, profit tracking, and inventory thresholds.

| Field | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` (string) | No | `gen_random_uuid()` | Unique variant identifier |
| `product_id` | `UUID` (string) | No | - | Foreign key referencing `products.id` (`ON DELETE CASCADE`) |
| `size` | `string` | No | - | Packaging size label (e.g. `'350'`, `'1L'`, `'gal'`, `'500 ml'`, `'20 L'`) |
| `cost_price` | `number` (numeric 10,2) | No | `0.00` | Replenishment/production unit cost in PHP (`>= 0`) |
| `selling_price` | `number` (numeric 10,2) | No | `0.00` | Retail/wholesale selling price in PHP (`>= 0`) |
| `stock_quantity` | `number` (integer) | No | `0` | Current on-hand inventory count (`>= 0`) |
| `min_stock_level` | `number` (integer) | No | `0` | Alert threshold triggering low stock warnings (`>= 0`) |
| `created_at` | `string` (ISO-8601) | No | `now()` | Variant creation timestamp |
| `updated_at` | `string` (ISO-8601) | No | `now()` | Variant last update timestamp |

**Invariants & Constraints**:
- `CONSTRAINT uq_product_variant_size UNIQUE (product_id, size)`: Prevents identical size labels on the same parent product.
- `CONSTRAINT product_variants_size_not_empty CHECK (trim(size) <> '')`: Enforces non-empty packaging labels.
- `CHECK (cost_price >= 0)` and `CHECK (selling_price >= 0)`.
- `CHECK (stock_quantity >= 0)` and `CHECK (min_stock_level >= 0)`.

---

### Entity: Category
Represents a condiment grouping (e.g., "Soy Sauce", "Vinegar", "Fish Sauce", "Cooking Oil").

| Field | Type | Nullable | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` (string) | No | `gen_random_uuid()` | Unique category identifier |
| `name` | `string` | No | - | Category display name (1-100 characters) |
| `created_at` | `string` (ISO-8601) | No | `now()` | Category creation timestamp |
| `updated_at` | `string` (ISO-8601) | No | `now()` | Category last update timestamp |

---

## 2. Schema Migration

Migration file: `supabase/migrations/20261119000000_allow_dynamic_product_variants.sql`

```sql
-- Migration: 20261119000000_allow_dynamic_product_variants.sql
-- Feature: ARL-38 (In-Form Category Creation & Dynamic Product Variant Management)

-- 1. Drop the legacy check constraint restricting size to '350', '1L', 'gal'
ALTER TABLE public.product_variants 
    DROP CONSTRAINT IF EXISTS product_variants_size_check;

-- 2. Add non-empty check constraint on size
ALTER TABLE public.product_variants 
    ADD CONSTRAINT product_variants_size_not_empty 
    CHECK (trim(size) <> '');

-- 3. Ensure index exists on product_variants (product_id, size)
CREATE INDEX IF NOT EXISTS product_variants_product_id_size_idx 
    ON public.product_variants (product_id, size);
```

---

## 3. Data Transfer Objects (DTOs) & Contracts

```ts
export interface VariantInput {
  id?: string;
  size: string;
  cost_price: number;
  selling_price: number;
  min_stock_level: number;
  opening_stock?: number;
}

export interface ProductInput {
  name: string;
  category_id?: string | null;
  variants: VariantInput[];
}

export interface ProductVariantDTO {
  id: string;
  product_id: string;
  size: string;
  cost_price: number;
  selling_price: number;
  unit_profit: number;
  stock_quantity: number;
  min_stock_level: number;
  created_at: string;
  updated_at: string;
}

export interface ProductWithVariants {
  id: string;
  name: string;
  category_id: string | null;
  category_name?: string | null;
  variants: ProductVariantDTO[];
  created_at: string;
  updated_at: string;
}
```
