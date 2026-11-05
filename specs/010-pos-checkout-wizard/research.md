# Technical Research & Architecture Decisions: POS-Style Checkout Wizard

**Feature Key**: `ARL-14`  
**Feature Slug**: `010-pos-checkout-wizard`  
**Epic**: `EPIC-3: Interactive Workflows, Transactions & Business Logic` (`ARL-11`)  

---

## 1. Stack Alignment & Context

- **Framework**: Next.js 16 (App Router) with React 19 Client Components for interactive POS state and Server Actions for atomic mutation.
- **Database & Storage**: Supabase PostgreSQL with SSR authentication (`@supabase/ssr`) and authenticated admin role enforcement.
- **Styling**: Tailwind CSS v4 using semantic design tokens (`lib/tokens.ts`, `app/globals.css`, zero hardcoded hex/RGB).
- **Mockup Reference**:
  - `mockup/index.html` & `mockup/app.js` lines 400–437 (`newSale()`, `A.addLine()`, `A.rmLine()`, `A.line()`, `A.qty()`, `A.saveSale()`).
  - `mockup/styles.css` lines 270–280 (`.stepper`, `.stepper button`, `.stepper input`), lines 240–260 (`.split`, `.stack`, `.summary`), lines 286–292 (`.pill`), lines 295–310 (`.seg`, `.seg label`).

---

## 2. Architectural Analysis & Decisions

### Decision 1: Relational Schema for Sale Line Items (`sale_items` table)
- **Problem**:
  Currently, `public.sales` holds header-level metadata (`receipt_number`, `total_amount`, `amount_paid`, `payment_status`, `order_status`), but individual condiment variant line items were not persisted in a dedicated relational table.
- **Decision**:
  - Create table `public.sale_items` with foreign keys to `public.sales` and `public.product_variants`.
  - Capture historical snapshots: `unit_price NUMERIC(10,2)` and `unit_cost NUMERIC(10,2)` to preserve accurate gross profit calculations even if future catalog prices change.
  - Enable RLS policies for authenticated users.

### Decision 2: Sequential Receipt Number Generation
- **Problem**:
  Every sale requires an unambiguous, sequential receipt identifier in the format `ARLQ-XXXXX` (e.g. `ARLQ-01041`, `ARLQ-01064`). Concurrency must not generate conflicting collisions or gaps.
- **Decision**:
  - Parse the highest existing numerical suffix from `sales.receipt_number` where format matches `^ARLQ-(\d+)$`.
  - Increment the numeric component and pad with leading zeros to 5 digits (e.g. `ARLQ-01064`).
  - In Postgres, maintain a unique constraint on `receipt_number`.

### Decision 3: Atomic Multi-Table Stock Deduction and Audit Movement
- **Problem**:
  When a sale is finalized, three distinct operations must occur in lockstep:
  1. Record the `sales` and `sale_items` rows.
  2. Decrement `stock_quantity` on `product_variants`.
  3. Write corresponding `'Sale'` movement entries to `stock_movements`.
  If stock is insufficient or any operation fails, the transaction must roll back cleanly.
- **Decision**:
  - Implement a Postgres database function / RPC or transactional service execution `recordSaleTransaction()` that validates current inventory stock before deducting.
  - Provide an in-memory service counterpart in `lib/sales/sale-service.ts` that provides the exact same atomic guarantees for offline development, local unit tests, and seamless fallbacks.

### Decision 4: Interactive Client Component UX with Real-Time Stock Validation
- **Problem**:
  Cashiers need instant feedback when typing or clicking quantity steppers without waiting for full page reloads or laggy server roundtrips.
- **Decision**:
  - Build `NewSaleWizard` as an interactive client component.
  - Provide client-side calculation of line totals, grand totals, profit rollup, and stock warnings.
  - Disable the "Save sale" button immediately whenever any line quantity exceeds available stock or when customer is unselected.
  - When saving, show loading state, invoke the server action / service, trigger toast notification, and navigate to `/sales/[id]`.
