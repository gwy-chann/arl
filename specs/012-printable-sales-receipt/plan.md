# Implementation Plan: Printable Official Sales Receipt with POS Thermal Print Layout

**Feature Key**: `ARL-16`  
**Feature Slug**: `012-printable-sales-receipt`  

---

## 1. Architecture & Component Decomposition

```mermaid
flowchart TD
    A[SaleDetailPage /sales/id] -->|Click 'Print receipt'| B[ReceiptPreviewPage /receipt/id]
    B --> C[ReceiptView - Monospace Thermal Card]
    B --> D[ReceiptPrintButton - Invokes window.print]
    B --> E[Link 'Back to sale' - Returns to /sales/id]
    C --> F[Header: ARLQ Food Condiments Trading]
    C --> G[Metadata: Receipt no., Date, Customer]
    C --> H[Itemized Rows: Product - Size, Qty x Price, Total]
    C --> I[Totals & Balance]
    C --> J[Payment Stamp: PAID / PARTIALLY PAID / NOT YET PAID]
    C --> K[Footer: Thank you for your business!]
    D -->|window.print| L[Browser Native Print Dialog]
    L -.->|@media print styles in globals.css| M[Clean Thermal Print: No Chrome, No Nav, Crisp Black Ink]
```

### Component Hierarchy
- `app/(admin)/receipt/[id]/page.tsx`: Server component fetching `sale` via `SaleService.getSaleById(id)` and rendering page container, breadcrumbs, header actions, and `ReceiptView`.
- `components/receipt/receipt-view.tsx`: Thermal receipt presenter with Courier Prime monospace typography, dashed borders, itemized lines, totals, and payment status stamp.
- `components/receipt/receipt-print-button.tsx`: Client component with printer icon that calls `window.print()`.
- `lib/receipt/receipt-service.ts`: Domain logic transformation: `toReceiptSnapshot(sale)` and payment status calculation.
- `app/globals.css`: Media print stylesheet isolating the receipt, hiding `.sidebar`, `.topbar`, `.page-head`, breadcrumbs, and `.no-print` elements.

---

## 2. Design System & Token Compliance

In accordance with `AGENTS.md` and zero hardcoded colors:
- Backgrounds: `bg-bg-input` for receipt canvas wrapper, `bg-bg-surface` for receipt sheet.
- Borders: `border-border` for outer boundary, `border-border-subtle` with `border-dashed` for receipt separators.
- Typography: `font-mono` with fallback to `Courier Prime`, `Courier New`, monospace.
- Status stamps:
  - `PAID`: `text-success`
  - `PARTIALLY PAID`: `text-accent`
  - `NOT YET PAID`: `text-danger`
- Print media overrides: `@media print` strictly enforces `#ffffff` background and `#000000` text for maximum legibility and zero ink bleeding on thermal and standard paper.

---

## 3. Test Strategy & Acceptance Matrix

1. **Unit & Domain Tests (`tests/receipt.test.ts`)**:
   - `toReceiptSnapshot`: Verify correct mapping of sale details to receipt snapshot.
   - Scenario 1: Thermal receipt content formatting (header, item rows, sublines, totals).
   - Scenario 2: Payment status stamp classification:
     - Fully paid sale -> `PAID`.
     - Partially paid sale -> `PARTIALLY PAID` with remaining balance.
     - Unpaid sale -> `NOT YET PAID` with total balance.
   - Scenario 4: Fast navigation path resolution (`/sales/${sale.id}`).
   - Scenario 5: Missing or invalid sale fallback.
2. **Typecheck & Linting**:
   - `npx tsc --noEmit`
   - `npm run lint`
3. **End-to-End Suite**:
   - `npm test` passing all existing and new test suites.
