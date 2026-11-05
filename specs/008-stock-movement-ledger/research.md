# Technical Research: Stock-In & Stock-Out Ledger with Movement Audit

**Feature Key**: `ARL-13`  
**Feature Slug**: `008-stock-movement-ledger`  

---

## 1. Architectural Strategy & Stack Constraints

1. **Framework & Engine**:
   - Next.js 15+ App Router (`app/(admin)/inventory/...`).
   - Server Component entry points (`inventory/in/page.tsx`, `inventory/out/page.tsx`, `inventory/history/page.tsx`) for SSR data fetching and hydration.
   - Client Components for interactive UI (`stock-form.tsx`, `movement-table.tsx`, `inventory-tabs.tsx`).
   - Node.js native test runner (`node --no-warnings=ExperimentalWarning --test --experimental-strip-types "tests/*.test.ts"`) for rapid, deterministic test execution.

2. **Database & Persistence (Supabase / PostgreSQL)**:
   - Tables:
     - `public.stock_movements`:
       - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
       - `variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT`
       - `movement_type TEXT NOT NULL CHECK (movement_type IN ('In', 'Out', 'Sale'))`
       - `quantity INTEGER NOT NULL CHECK (quantity > 0)`
       - `reason TEXT NOT NULL`
       - `note TEXT NOT NULL DEFAULT ''`
       - `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
     - Indexes:
       - `stock_movements_variant_id_idx ON public.stock_movements(variant_id)`
       - `stock_movements_type_idx ON public.stock_movements(movement_type)`
       - `stock_movements_created_at_idx ON public.stock_movements(created_at DESC)`
   - Security:
     - Row Level Security (RLS) enabled on `stock_movements`.
     - Policy granting full access to authenticated admins.
   - Atomic Stock Transaction Invariance:
     - When Stock In is recorded:
       - Update `product_variants` setting `stock_quantity = stock_quantity + quantity, updated_at = now()` where `id = variant_id`.
       - Insert audit entry into `stock_movements`.
     - When Stock Out is recorded:
       - Check `current_stock >= quantity`. If not, abort with error `"Only {current_stock} in stock"`.
       - Update `product_variants` setting `stock_quantity = stock_quantity - quantity, updated_at = now()` where `id = variant_id AND stock_quantity >= quantity`.
       - Insert audit entry into `stock_movements`.
   - Dual-mode Architecture:
     - In production/Supabase environment: Executes atomic SQL / Supabase RPC or transaction.
     - In development/testing environment (or when offline): In-memory domain repository (`stock-service.ts`) mirrors database behavior with pre-seeded baseline data from `mockup/app.js` (`INITIAL_PRODUCTS` and `INITIAL_MOVEMENTS`).

3. **Domain Alignment with Mockup**:
   - Standard Reason Codes:
     - Stock In: `['Restock from warehouse', 'Return from customer', 'Correction']`
     - Stock Out: `['Damaged or spilled', 'Sample or giveaway', 'Used for repacking', 'Correction']`
   - Form defaults and formatting:
     - Date display: current date formatted in `en-PH` (e.g. `Nov 5, 2026`).
     - Product dropdown: displays product name, size label, and current available stock (e.g. `Toyo - 1 L (58 in stock)`).
     - Recent movements card: displays up to 5 latest movements with variant label, relative/formatted date, composite note, and signed quantity (`+X` or `-X`).
   - Movement History Filter:
     - Filter by type: `All movements`, `In`, `Out`.
     - Real-time search by product name or note.
     - Signed quantity formatting: `+X` for In, `-X` for Out/Sale.
     - Badge pills:
       - `'In'` -> `Stock in` with token `badge-success` (`bg-success-light text-success border border-success-border`).
       - `'Out'` with note starting with `'Sale'` -> `Sale` with token `badge-info` (`bg-info-light text-info border border-info-border`).
       - `'Out'` non-sale -> `Stock out` with token `badge-accent` (`bg-accent-light text-accent border border-accent-border`).

4. **Design System & Zero Hardcoded Colors Rule**:
   - Zero inline hex (`#...`) or standard Tailwind palette (`bg-blue-600`, `text-red-500`).
   - Mandatory semantic tokens:
     - Surfaces: `bg-bg-surface`, `bg-bg-base`, `bg-bg-card`, `bg-bg-input`.
     - Text: `text-text-primary`, `text-text-secondary`, `text-text-muted`.
     - Action: `bg-primary hover:bg-primary-hover text-text-light`.
     - Secondary: `bg-secondary hover:bg-secondary-hover text-text-primary border-border`.
     - Badges: `bg-success-light text-success`, `bg-accent-light text-accent`, `bg-info-light text-info`.
     - Layout: `.split` grid for 2-column form + recent list on desktop, stacked on mobile.
