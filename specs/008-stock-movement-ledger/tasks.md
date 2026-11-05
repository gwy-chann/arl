# Tasks: Stock-In & Stock-Out Ledger with Movement Audit

**Feature Key**: `ARL-13`  
**Feature Slug**: `008-stock-movement-ledger`  

---

## Task Matrix & Execution Plan

- [ ] **Task 1: Database Schema & Seed Migration** (`supabase/migrations/20261105030000_create_stock_movements_table.sql`)
  - Create `stock_movements` table with `id`, `variant_id`, `movement_type`, `quantity`, `reason`, `note`, `created_at`.
  - Add foreign key reference to `product_variants(id)` with `ON DELETE RESTRICT`.
  - Add check constraints: `quantity > 0`, `movement_type IN ('In', 'Out', 'Sale')`.
  - Create performance indexes on `variant_id`, `movement_type`, and `created_at DESC`.
  - Enable RLS policies for authenticated administrators.
  - Insert seed historical movements matching `mockup/app.js`.

- [ ] **Task 2: Contracts & Domain Service Engine** (`lib/inventory/`)
  - Implement `specs/008-stock-movement-ledger/contracts/stock-contracts.ts` with Zod schema (`stockMovementInputSchema`) and formatting helpers.
  - Implement `lib/inventory/stock-contracts.ts` re-export wrapper.
  - Implement `lib/inventory/stock-service.ts` with atomic stock adjustments, insufficient stock safeguard, movement history retrieval, and in-memory store baseline.
  - Implement `lib/inventory/stock-actions.ts` with server action `recordStockMovementAction`.

- [ ] **Task 3: Unit Tests (TDD)** (`tests/stock-movements.test.ts`)
  - Test Zod validation rules (variant selection, integer quantity >= 1, reason).
  - Test Scenario 1: Warehouse delivery stock in (Toyo 1L: 58 + 24 -> 82, toast confirmation).
  - Test Scenario 2: Damage stock out (Suka 1 gal: 6 - 1 -> 5, toast confirmation).
  - Test Scenario 3: Prevent stock out exceeding available stock (Patis 1 gal: 14 attempted 15 -> halts with "Only 14 in stock", no mutation).
  - Test Scenario 4: Movement history filtering by type ("In" -> only positive signed quantities, "Out", "All movements").
  - Test search filtering across product name and note.

- [ ] **Task 4: UI Components** (`components/inventory/`)
  - Implement `components/inventory/inventory-tabs.tsx` for consistent navigation across `/inventory`, `/inventory/in`, `/inventory/out`, `/inventory/low`, `/inventory/history`.
  - Implement `components/inventory/stock-form.tsx` rendering the 2-column split layout with product selector, quantity, date, reason codes, note, and recent movements card.
  - Implement `components/inventory/movement-table.tsx` with Type filter dropdown, real-time search input, signed quantities, and badge pills.
  - Implement `components/inventory/inventory-overview-table.tsx` for `/inventory` with quick links to Stock in and Stock out.

- [ ] **Task 5: Next.js Admin App Routes** (`app/(admin)/inventory/`)
  - Wire `app/(admin)/inventory/in/page.tsx` with `StockForm` (`kind="in"`).
  - Wire `app/(admin)/inventory/out/page.tsx` with `StockForm` (`kind="out"`).
  - Wire `app/(admin)/inventory/history/page.tsx` with `MovementTable`.
  - Wire `app/(admin)/inventory/page.tsx` with overview stock table and navigation tabs.

- [ ] **Task 6: Verification, Typecheck, and Atomic Commits**
  - Execute `npm test` inside `.worktrees/ARL-13`.
  - Execute `npm run typecheck` inside `.worktrees/ARL-13`.
  - Verify compliance with Zero Hardcoded Colors Rule and WCAG 2.1 AA.
  - Stage and create layer-by-layer atomic Git commits linked to `[ARL-13]`.
