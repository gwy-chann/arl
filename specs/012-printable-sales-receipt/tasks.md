# Implementation Tasks: Printable Official Sales Receipt with POS Thermal Print Layout

**Feature Key**: `ARL-16`  
**Feature Slug**: `012-printable-sales-receipt`  
**Jira Story**: STORY-3.5: Printable Official Sales Receipt with POS Thermal Print Layout  

---

## Task Matrix & Dependency Order

```mermaid
flowchart TD
    T1[Task 1: Contracts & Data Models\nlib/receipt/receipt-contracts.ts] --> T2[Task 2: Service Layer & Snapshot Transformation\nlib/receipt/receipt-service.ts]
    T2 --> T3[Task 3: Unit Tests TDD Red Phase\ntests/receipt.test.ts]
    T3 --> T4[Task 4: Monospace Thermal Receipt Presenter\ncomponents/receipt/receipt-view.tsx]
    T4 --> T5[Task 5: Client Print Action Button\ncomponents/receipt/receipt-print-button.tsx]
    T5 --> T6[Task 6: Print Stylesheet @media print\napp/globals.css]
    T6 --> T7[Task 7: Receipt Preview Route\napp/(admin)/receipt/[id]/page.tsx]
    T7 --> T8[Task 8: End-to-End Verification & Convergence\nnpm test + tsc + lint + graphify]
```

---

## Detailed Task Breakdown

### Phase 1: Contracts & Data Models
- [ ] **Task 1** [P] [US1] Define receipt contracts and schemas in `lib/receipt/receipt-contracts.ts`:
  - `ReceiptItemSchema` and `ReceiptItem` type (`variant_label`, `product_name`, `packaging_size`, `quantity`, `unit_price`, `line_total`).
  - `ReceiptPaymentStatusSchema` (`PAID`, `PARTIALLY PAID`, `NOT YET PAID`).
  - `ReceiptSnapshotSchema` and `ReceiptSnapshot` interface.

### Phase 2: Domain Logic & Transformation Service
- [ ] **Task 2** [US1] Implement receipt domain transformation in `lib/receipt/receipt-service.ts`:
  - `formatReceiptDate(isoString: string): string` (formats to `Oct 11, 2026`).
  - `getReceiptPaymentStatus(amountPaid: number, balance: number): ReceiptPaymentStatus` (`PAID`, `PARTIALLY PAID`, `NOT YET PAID`).
  - `toReceiptSnapshot(sale: SaleDetail): ReceiptSnapshot`:
    - Formats product size label (`350` -> `350 ml`, `1L` -> `1 L`, `gal` -> `1 gal`).
    - Maps items to receipt items with line totals.
    - Computes formatted date, totals, amount paid, balance, and payment status stamp.

### Phase 3: Unit Testing (TDD - Red Phase)
- [ ] **Task 3** [US1] Create unit test suite in `tests/receipt.test.ts`:
  - Scenario 1: Thermal receipt content formatting (header, receipt number, date, customer name, items, totals).
  - Scenario 2: Payment status stamp classification:
    - Fully paid sale (`balance == 0`) -> `PAID`.
    - Partially paid sale (`balance > 0`, `amount_paid > 0`) -> `PARTIALLY PAID` with remaining balance.
    - Unpaid sale (`amount_paid == 0`) -> `NOT YET PAID` with remaining balance.
  - Scenario 3: Date formatting and size labeling edge cases.
  - Scenario 4: Fast navigation path verification (`/sales/${id}`).
  - Scenario 5: Missing or invalid sale fallback.

### Phase 4: Monospace Thermal Receipt UI Component
- [ ] **Task 4** [P] [US1] Create `components/receipt/receipt-view.tsx`:
  - Centered thermal paper card layout (`max-w-[400px]`, `w-full`, `font-mono`).
  - Header: **ARLQ Food Condiments Trading** / `Official Receipt` with dashed border.
  - Metadata: Receipt no., Date, Customer name.
  - Dashed horizontal divider (`border-t border-dashed border-border-subtle`).
  - Itemized items: Variant description with `{qty} × {price}` on left, `{line_total}` on right.
  - Totals: Bold `TOTAL`, `Amount paid`, and conditional `Remaining balance` if balance > 0.
  - Stamp: Bold uppercase payment status (`PAID` in `text-success`, `PARTIALLY PAID` in `text-accent`, `NOT YET PAID` in `text-danger`).
  - Footer: "Thank you for your business!" in muted text.
  - Pure semantic design tokens, zero hardcoded hex/RGB colors.

### Phase 5: Client Print Action Button
- [ ] **Task 5** [P] [US1] Create `components/receipt/receipt-print-button.tsx`:
  - Client component (`'use client'`).
  - Printer SVG icon.
  - Primary button styling (`bg-primary text-text-light hover:bg-primary-hover`).
  - `onClick={() => window.print()}`.

### Phase 6: Print Stylesheet Formatting
- [ ] **Task 6** [US1] Add `@media print` rules in `app/globals.css`:
  - Sets pure white background and pure black typography.
  - Hides admin shell: `.sidebar`, `.topbar`, `.page-head`, `nav[aria-label="Breadcrumb"]`, `.no-print`, `.toasts`, action buttons.
  - Resets `.receipt-wrap` and `.receipt` to full width with zero shadows, zero outer padding, and crisp printable borders.
  - Prevents page breaks inside `.receipt-item` rows (`break-inside: avoid`).

### Phase 7: Receipt Preview Route
- [ ] **Task 7** [US1] Implement `app/(admin)/receipt/[id]/page.tsx`:
  - Server Component with metadata `Receipt Preview | ARLQ Food Condiments Trading`.
  - Authenticated via `(admin)/layout.tsx`.
  - Fetches sale by ID via `SaleService.getSaleById(id)`.
  - Fallback error state if sale not found with link back to `/sales`.
  - Breadcrumbs: `Sales` (`/sales`) > `{receipt_number}` (`/sales/{id}`) > `Receipt`.
  - Header with title `Receipt preview`, subtitle `Review and print.`, `ReceiptPrintButton`, and `Back to sale` button.
  - Renders `ReceiptView` inside receipt wrapper.

### Phase 8: Verification & Convergence
- [ ] **Task 8** Execute full test suite, typecheck, lint, and Graphify sync:
  - Run `npm test` inside the worktree (all tests passing).
  - Run `npx tsc --noEmit` inside the worktree (zero errors).
  - Run `npm run lint` inside the worktree (zero warnings/errors).
  - Sync Graphify AST map (`graphify-auto-sync`).
