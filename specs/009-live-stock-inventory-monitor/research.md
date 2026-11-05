# Technical Research & Architecture Decisions: Live Stock Inventory Monitor & Capacity Level Meters

**Feature Key**: `ARL-12`  
**Feature Slug**: `009-live-stock-inventory-monitor`  
**Epic**: `EPIC-3: Inventory Movement Ledger & Stock Auditing` (`ARL-11`)  

---

## 1. Stack Alignment & Context

- **Framework**: Next.js 16 (App Router) with React 19 Client and Server Components.
- **Database & Auth**: Supabase PostgreSQL with SSR authentication (`@supabase/ssr`) and authenticated admin session checking.
- **Realtime**: `@supabase/supabase-js` Realtime channels (`postgres_changes` on `product_variants`).
- **Styling**: Tailwind CSS v4 using semantic design tokens (`lib/tokens.ts`, `app/globals.css`).
- **Mockup Reference**: `mockup/index.html` lines 352–399 (`inventory()`, `lowStock()`, `invTabs()`), `mockup/styles.css` lines 329–333 (`.meter`, `.meter.low`), lines 286–292 (`.pill`).

---

## 2. Architectural Analysis & Decisions

### Decision 1: Hybrid Server/Client Rendering with Realtime Subscriptions
- **Problem**: 
  We want instant page loads with initial server-side rendering for SEO and zero client layout shift, but also instant real-time synchronization when stock changes occur (POS sales, stock entries, etc.) without manual page refreshes.
- **Decision**:
  - The page components (`app/inventory/page.tsx` and `app/inventory/low/page.tsx`) are Server Components fetching initial variant data via `getInventoryVariants()` from the server Supabase client.
  - The client table components (`InventoryTable` and `LowStockTable`) receive initial variants as props and manage local reactive state initialized from props.
  - A dedicated hook `useInventoryRealtime()` sets up a Supabase channel subscribing to `postgres_changes` on `public.product_variants`. When an `UPDATE` event arrives, local state is patched immutably so meters, badges, and rows refresh instantly.
  - On unmount, the hook cleanly tears down the channel.

### Decision 2: PostgreSQL Realtime Publication Enablement
- **Problem**:
  Supabase Realtime only broadcasts row-level changes for tables added to the `supabase_realtime` publication. `product_variants` was not explicitly added to this publication in initial migrations.
- **Decision**:
  - Add a dedicated migration: `20261105030000_enable_realtime_for_product_variants.sql`
  - Command:
    ```sql
    ALTER PUBLICATION supabase_realtime ADD TABLE public.product_variants;
    ```
  - Also ensure REPLICA IDENTITY FULL or default is configured so primary keys and changed columns are included in payload payloads.

### Decision 3: Mathematical Formulas for Meter & Badges
- **Problem**:
  The meter progress bar must reflect the visual proportions of the original mockup without overflowing or dividing by zero.
- **Mockup Source**:
  ```js
  const stockStatus = v => v.stock===0 ? pill('Out of stock','bad') : isLow(v) ? pill('Low stock','warn') : v.stock<=v.min*1.4 ? pill('Getting low','warn') : pill('In stock','ok');
  const meterWidth = Math.min(v.stock / (v.min * 2.5) * 100, 100);
  ```
- **Implementation in TypeScript**:
  ```ts
  export function computeCapacityMeter(stock: number, min: number): {
    percentage: number;
    isLow: boolean;
    status: 'out-of-stock' | 'low-stock' | 'getting-low' | 'in-stock';
    statusLabel: string;
    statusVariant: 'bad' | 'warn' | 'ok';
    shortBy: number;
  } {
    const isOut = stock === 0;
    const isLow = stock > 0 && stock <= min;
    const isGettingLow = stock > min && stock <= min * 1.4;
    
    let status: 'out-of-stock' | 'low-stock' | 'getting-low' | 'in-stock' = 'in-stock';
    let statusLabel = 'In stock';
    let statusVariant: 'bad' | 'warn' | 'ok' = 'ok';

    if (isOut) {
      status = 'out-of-stock';
      statusLabel = 'Out of stock';
      statusVariant = 'bad';
    } else if (isLow) {
      status = 'low-stock';
      statusLabel = 'Low stock';
      statusVariant = 'warn';
    } else if (isGettingLow) {
      status = 'getting-low';
      statusLabel = 'Getting low';
      statusVariant = 'warn';
    }

    const baseline = min > 0 ? min * 2.5 : 100;
    const rawPct = (stock / baseline) * 100;
    const percentage = Math.max(0, Math.min(100, Math.round(rawPct)));
    const shortBy = Math.max(0, min - stock);

    return {
      percentage,
      isLow: isOut || isLow,
      status,
      statusLabel,
      statusVariant,
      shortBy,
    };
  }
  ```

### Decision 4: CSS Tokens for `.meter` and `.pill`
- **Problem**:
  Must strictly follow zero hardcoded colors and integrate seamlessly with universal dark mode.
- **Decision**:
  - Meter container:
    `relative flex-1 h-[7px] rounded-[9px] bg-bg-muted border border-border overflow-hidden min-w-[24px]`
  - Meter inner bar:
    `block h-full rounded-[9px] transition-all duration-300 ease-out`
    When healthy: `bg-primary` (light) / `dark:bg-[#22C55E]` (or CSS variable mapping).
    When low/out: `bg-danger` (light) / `dark:bg-[#EF4444]`.
  - Pill badges:
    `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[13px] font-semibold leading-[22px] whitespace-nowrap`
    - `ok`: `bg-success-light text-success border border-success-border`
    - `warn`: `bg-accent-light text-accent border border-accent-border`
    - `bad`: `bg-danger-light text-danger border border-danger-border`

### Decision 5: Sub-navigation Component (`InventoryTabs`)
- **Problem**:
  Multiple inventory views (`/inventory`, `/inventory/low`, `/inventory/in`, `/inventory/out`, `/inventory/history`) require consistent horizontal tabs navigation.
- **Decision**:
  - Create reusable `InventoryTabs` component in `components/inventory/inventory-tabs.tsx`.
  - Uses `usePathname()` to highlight the active tab matching `activeTab="inventory"` or `activeTab="low"`.
  - Future features (`ARL-13`) will cleanly plug into `/inventory/in`, `/inventory/out`, `/inventory/history` using the same component.
