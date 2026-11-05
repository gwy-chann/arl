# Implementation Tasks: Sales Transaction Ledger, Detail View & Status Manager

**Feature Key**: `ARL-15`  
**Feature Slug**: `011-sales-ledger-detail-status-manager`  
**Jira Story**: STORY-3.4: Sales Transaction Ledger, Detail View & Status Manager  

---

## Task Matrix & Dependency Order

```mermaid
flowchart TD
    T1[Task 1: Contracts & Extended DTOs\nlib/sales/sale-contracts.ts] --> T2[Task 2: Service Layer & Overdue Computation\nlib/sales/sale-service.ts]
    T2 --> T3[Task 3: Unit Tests TDD Red Phase\ntests/sales-ledger-detail.test.ts]
    T3 --> T4[Task 4: Server Actions for Payment & Order Updates\nlib/sales/sale-actions.ts]
    T4 --> T5[Task 5: Status Pills & Overdue Banner Components\nStatusPill & OverdueAlertBanner]
    T5 --> T6[Task 6: Sales Ledger Table Component & Page\ncomponents/sales/sales-ledger-table.tsx & app/sales/page.tsx]
    T6 --> T7[Task 7: Sale Detail Page & Payment/Order Managers\ncomponents/sales/sale-payment-manager.tsx & app/sales/[id]/page.tsx]
    T7 --> T8[Task 8: End-to-End Verification & Green Suite\ntests/sales-ledger-detail.test.ts + typecheck + lint]
```

---

## Detailed Task Breakdown

### Phase 1: Contracts & Schema Validation
- [ ] **Task 1**: Update `lib/sales/sale-contracts.ts`:
  - Add `updateSalePaymentSchema` with Zod validation.
  - Add `updateSaleOrderStatusSchema` with Zod validation.
  - Extend `SaleTransactionDTO` with customer contact (`phone`, `address`) and optional overdue calculation properties (`days_unpaid`, `is_overdue`, `days_overdue`).

### Phase 2: Domain Logic & Service Layer
- [ ] **Task 2**: Update `lib/sales/sale-service.ts`:
  - Implement calculation helpers:
    - `getDaysUnpaid(createdAt: string, asOfDate?: Date): number`
    - `isSaleOverdue(balance: number, createdAt: string, reminderDays: number, asOfDate?: Date): boolean`
    - `getOverdueDays(createdAt: string, reminderDays: number, asOfDate?: Date): number`
  - Implement `updateSalePayment(saleId, paymentStatus, amountPaid)`:
    - Sets `amount_paid = total_amount` when 'Paid', `0` when 'Not Yet Paid', validated amount when 'Partially Paid'.
    - Computes `balance`.
    - Updates Supabase and memory.
    - Synchronizes customer debt rollup.
  - Implement `updateSaleOrderStatus(saleId, orderStatus)`:
    - Updates `order_status` in Supabase and memory.

### Phase 3: Unit Testing (TDD - Red Phase)
- [ ] **Task 3**: Create unit test suite in `tests/sales-ledger-detail.test.ts` covering:
  - Scenario 1: Sales ledger search and status filtering (Paid, Partially Paid, Not Yet Paid).
  - Scenario 2: Overdue calculation and alert banner text (9 days unpaid with 7 day threshold -> 2 days overdue).
  - Scenario 3: Payment status update to fully paid (₱1,340 unpaid -> amount_paid=1340, balance=0, overdue banner dismissed).
  - Scenario 4: Order fulfillment state transition (Pending -> Delivered with info token).
  - Edge cases: Non-existent sale ID handling, partial payment bounds (`0 < amount < total`), pluralization of overdue days.

### Phase 4: Server Actions
- [ ] **Task 4**: Add Server Actions in `lib/sales/sale-actions.ts`:
  - `updateSalePaymentAction(input: UpdateSalePaymentInput)`
  - `updateSaleOrderStatusAction(input: UpdateSaleOrderStatusInput)`
  - Revalidate paths: `/sales`, `/sales/[id]`, `/customers`, `/customers/[id]`, `/dashboard`.

### Phase 5: Reusable Status UI Components
- [ ] **Task 5**: Implement UI components:
  - `SaleStatusPills` or shared status pills in `components/sales/sale-status-pill.tsx`:
    - `PaymentStatusPill`: `Paid` (`ok`), `Partially Paid` (`warn`), `Not Yet Paid` (`bad`), plus `Overdue` (`bad`).
    - `OrderStatusPill`: `Pending` (`warn`), `Delivered` (`info`), `Picked Up` (`info`).
  - `OverdueAlertBanner` in `components/sales/overdue-alert-banner.tsx`:
    - Danger background `bg-danger-light`, border `border-danger-border`, text `text-danger`, red dot indicator.

### Phase 6: Sales Ledger Table & Ledger Page
- [ ] **Task 6**: Implement Sales Ledger UI:
  - `components/sales/sales-ledger-table.tsx`:
    - Search input for receipt / customer name.
    - Payment dropdown filter and Order dropdown filter.
    - Table with columns: Receipt, Date, Customer, Total, Balance (red if > 0), Payment, Order.
    - Empty state when filtered out.
    - Clickable rows routing to `/sales/{id}`.
  - Replace placeholder in `app/(admin)/sales/page.tsx` with production Server Component.

### Phase 7: Sale Detail View & Management Cards
- [ ] **Task 7**: Implement Sale Detail View:
  - `components/sales/sale-payment-manager.tsx`: Segmented control (`Paid`, `Partially Paid`, `Not Yet Paid`), partial payment input, "Save payment" button, toast notification, and reactive balance update.
  - `components/sales/sale-order-manager.tsx`: Segmented control (`Pending`, `Delivered`, `Picked Up`), "Save order status" button, toast notification, and reactive pill update.
  - `app/(admin)/sales/[id]/page.tsx`: Full detail view with breadcrumbs, receipt number, print button, overdue alert banner, line items table with profit footer, customer info card, payment manager, and order manager.

### Phase 8: Verification & Quality Gates
- [ ] **Task 8**: Run full verification suite:
  - Run `npm test` inside the worktree (all green).
  - Run `npm run typecheck` inside the worktree.
  - Run `npm run lint` inside the worktree.
  - Verify zero hardcoded hex/RGB colors.
