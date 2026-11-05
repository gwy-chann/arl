# Technical Implementation Plan: Live Stock Inventory Monitor & Capacity Level Meters

**Feature Key**: `ARL-12`  
**Feature Slug**: `009-live-stock-inventory-monitor`  
**Epic**: `EPIC-3: Inventory Movement Ledger & Stock Auditing` (`ARL-11`)  

---

## 1. Architectural Approach & Boundaries

### Presentation Layer
- **`app/inventory/page.tsx`**: Server component loading initial variants, renders header, `InventoryTabs` (`activeTab="inventory"`), and `InventoryTable` (client component).
- **`app/inventory/low/page.tsx`**: Server component loading initial variants filtered by `stock_quantity <= min_stock_level`, renders header, `InventoryTabs` (`activeTab="low"`), and `LowStockTable` (client component).
- **`components/inventory/inventory-tabs.tsx`**: Reusable navigation bar linking to `/inventory`, `/inventory/in`, `/inventory/out`, `/inventory/low`, `/inventory/history`.
- **`components/inventory/capacity-meter.tsx`**: Progress meter component rendering `.meter` with inner `<i>` width and styling based on `computeCapacityMeter()`.
- **`components/inventory/stock-status-pill.tsx`**: Color-coded pill badge component rendering `Out of stock` (`bad`), `Low stock` / `Getting low` (`warn`), or `In stock` (`ok`).
- **`components/inventory/inventory-table.tsx`**: Client table with real-time search toolbar, variant rows, capacity meters, status pills, and action buttons.
- **`components/inventory/low-stock-table.tsx`**: Client table rendering variants at or below minimum with "Short by" count, "Stock in" navigation, and friendly empty state.

### Domain & Services Layer
- **`lib/services/inventory-service.ts`**:
  - `getInventoryVariants()`: Queries Supabase for all `product_variants` joined with `products`, mapped into `InventoryVariant` DTOs.
- **`lib/hooks/use-inventory-realtime.ts`**:
  - Sets up Supabase Realtime channel listening to `UPDATE` events on `product_variants`.
  - Immutably merges updated records into the local React state.

### Database Layer
- **`supabase/migrations/20261105030000_enable_realtime_for_product_variants.sql`**:
  - Executes `ALTER PUBLICATION supabase_realtime ADD TABLE public.product_variants;` to allow live Realtime event broadcasting.

---

## 2. Component Hierarchy

```
app/inventory/page.tsx (Server Component)
└── AppShell
    ├── Page Header ("Inventory", "Live stock for all nine variants...")
    ├── InventoryTabs (Tabs: Overview, Stock in, Stock out, Low stock alerts, Movement history)
    └── InventoryTable (Client Component)
        ├── SearchToolbar ("Search product or size")
        └── Table Grid
            └── TableRow (x9 variants)
                ├── Product & Size info
                ├── Stock count & Minimum
                ├── CapacityMeter (Dynamic percentage, .meter.low conditional)
                ├── StockStatusPill (Out of stock, Low stock, Getting low, In stock)
                └── ActionButtons (Stock in, Stock out)

app/inventory/low/page.tsx (Server Component)
└── AppShell
    ├── Page Header ("Low stock alerts", "Variants at or below the minimum level.")
    ├── InventoryTabs (activeTab="low")
    ├── LowStockTable (Client Component)
    │   ├── Table Grid (When low variants exist)
    │   │   └── TableRow
    │   │       ├── Product & Size
    │   │       ├── In stock (danger color)
    │   │       ├── Minimum threshold
    │   │       ├── Short by count (min - stock)
    │   │       └── Stock in button (links to /inventory/in?v={id})
    │   └── EmptyState ("Nothing is low", "Every variant is above its minimum level.")
    └── Settings Link Footer ("Change thresholds under Settings, Minimum stock levels.")
```

---

## 3. Test Strategy (TDD)

1. **Unit Tests (`__tests__/inventory/capacity-meter.test.ts`)**:
   - `computeCapacityMeter` calculations:
     - Out of stock: stock=0 -> 0%, isLow=true, 'out-of-stock', 'bad'.
     - Low stock: stock=21, min=36 -> isLow=true, 'low-stock', 'warn', shortBy=15.
     - Getting low: stock=32, min=24 (within 1.4x) -> isLow=false, 'getting-low', 'warn', shortBy=0.
     - In stock: stock=58, min=30 -> isLow=false, 'in-stock', 'ok'.
     - Division by zero safety: min=0.
     - Maximum cap: stock=500, min=10 -> caps at 100%.

2. **Component & Integration Tests (`__tests__/inventory/inventory-views.test.tsx`)**:
   - `InventoryTable` renders all 9 variants.
   - Search filtering by product name ("Toyo") or size ("350").
   - Action buttons have correct `href` attributes (`/inventory/in?v={id}`).
   - Realtime event simulation updates table row immediately.
   - `LowStockTable` displays "Short by" count correctly and renders empty state when no items are low.
