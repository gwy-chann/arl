# Implementation Tasks: POS-Style Multi-Line Checkout Wizard

**Feature Key**: `ARL-14`  
**Feature Slug**: `010-pos-checkout-wizard`  
**Jira Story**: STORY-3.3: POS-Style Multi-Line New Sale Checkout Wizard with Stock Validation  

---

## Task Matrix & Dependency Order

```mermaid
flowchart TD
    T1[Task 1: Relational Database Migration\nsale_items table + RLS] --> T2[Task 2: Contracts & Calculation Logic\nlib/sales/sale-contracts.ts & sale-service.ts]
    T2 --> T3[Task 3: Unit Tests TDD Red Phase\ntests/sales-checkout.test.ts]
    T3 --> T4[Task 4: Sales Service & Atomic Transaction\ncreateSaleTransaction with stock deduction & movement audit]
    T4 --> T5[Task 5: Server Actions\nlib/sales/sale-actions.ts]
    T5 --> T6[Task 6: Interactive UI Components\nSaleLineItemRow, SaleSummaryCard, NewSaleWizard]
    T6 --> T7[Task 7: Next.js Route Integration\napp/(admin)/sales/new/page.tsx]
    T7 --> T8[Task 8: Full Verification & Green Tests\ntests/sales-checkout.test.ts + lint + typecheck]
```

---

## Detailed Task Breakdown

### Phase 1: Database Migration
- [x] **Task 1**: Create migration `supabase/migrations/20261105060000_create_sale_items_table.sql`:
  - `public.sale_items` table with foreign keys to `sales` and `product_variants`.
  - Columns: `id`, `sale_id`, `variant_id`, `quantity`, `unit_price`, `unit_cost`, `created_at`.
  - Enable RLS policies for authenticated users.

### Phase 2: Contracts & Pure Calculation Logic
- [x] **Task 2**: Implement validation contracts and calculation utilities:
  - Create `lib/sales/sale-contracts.ts`: Zod schemas and TypeScript types.
  - Create `calculateSaleSummary()` in `lib/sales/sale-service.ts`: Computes totals, profit margins, balance, and live stock warnings.

### Phase 3: Unit Testing (TDD - Red Phase)
- [x] **Task 3**: Create unit tests in `tests/sales-checkout.test.ts` covering:
  - Scenario 1: Multi-line sale calculation (grand total ₱560, profit ₱115, stock decrement).
  - Scenario 2: Partial payment balance and customer debt registration.
  - Scenario 3: Real-time over-stock warning and disable check.
  - Scenario 4: Customer pre-selection.
  - Edge cases: Minimum quantity 1, empty line guard, sequential receipt formatting.

### Phase 4: Service Layer & Atomic Mutation
- [x] **Task 4**: Implement `createSaleTransaction()` and in-memory transactional store in `lib/sales/sale-service.ts`:
  - Atomically records sale header and line items.
  - Decrements variant stock in `product_variants`.
  - Inserts `'Sale'` movements in `stock_movements`.
  - Updates customer debt rollup balance.
  - Generates sequential receipt numbers (`ARLQ-XXXXX`).

### Phase 5: Server Actions
- [x] **Task 5**: Implement `submitNewSaleAction()` in `lib/sales/sale-actions.ts`:
  - Validates input with Zod.
  - Calls `createSaleTransaction()`.
  - Revalidates paths: `/sales`, `/inventory`, `/customers`.

### Phase 6: UI Components (Checkout Wizard)
- [x] **Task 6.1**: Implement `SaleLineItemRow` in `components/sales/sale-line-item-row.tsx`:
  - Product and Size selectors, quantity stepper (`−`/`+`/numeric input), line amount display, remove item button, stock warning note.
- [x] **Task 6.2**: Implement `SaleSummaryCard` in `components/sales/sale-summary-card.tsx`:
  - Items bottle count, gross profit display, total amount, payment status selector, amount paid input, remaining balance, order status selector, submit button with disabled states.
- [x] **Task 6.3**: Implement `NewSaleWizard` in `components/sales/new-sale-wizard.tsx`:
  - Customer select with debt display and `/customers/new` link, pre-selection logic, dynamic lines management (`addLine`, `removeLine`, `updateLine`), submission handling with toast notifications.

### Phase 7: Page Integration
- [x] **Task 7**: Update `app/(admin)/sales/new/page.tsx`:
  - Load customer directory and product catalog with variants.
  - Replace placeholder with `NewSaleWizard`.
  - Pass initial customer ID from search params.

### Phase 8: Verification & Convergence
- [x] **Task 8**: Run test suite (`npm test`), verify all tests pass (Green), run typecheck, and ensure zero regressions.
