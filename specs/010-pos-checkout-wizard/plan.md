# Technical Implementation Plan: POS-Style Checkout Wizard

**Feature Key**: `ARL-14`  
**Feature Slug**: `010-pos-checkout-wizard`  
**Epic**: `EPIC-3: Interactive Workflows, Transactions & Business Logic` (`ARL-11`)  

---

## 1. Architectural Approach & Boundaries

### Presentation Layer
- **`app/(admin)/sales/new/page.tsx`**:
  - Server Component fetching customer directory and product catalog with variants.
  - Accepts `searchParams.customerId` or `searchParams.customer`.
  - Renders the interactive POS checkout wizard.
- **`components/sales/new-sale-wizard.tsx`**:
  - Client component managing active line items, quantity steppers, live totals, profit margins, stock warnings, payment terms, and submission.
- **`components/sales/sale-line-item-row.tsx`**:
  - Individual line item component with product selector, size selector, stepper controls, line total, remove button, and live stock indicator.
- **`components/sales/sale-summary-card.tsx`**:
  - Order summary sidebar displaying bottle count, profit, total, payment status segmented control, amount paid input, remaining balance, order status segmented control, and primary "Save sale" button.

### Domain & Services Layer
- **`lib/sales/sales-contracts.ts`**:
  - Shared Zod validation schemas and TypeScript types.
- **`lib/sales/sale-service.ts`**:
  - `calculateSaleSummary()`: Pure calculation function for totals, profit, balance, and stock validation.
  - `generateNextReceiptNumber()`: Produces `ARLQ-XXXXX` from sequential database or memory records.
  - `createSaleTransaction()`: Orchestrates atomic insertion of `sales`, `sale_items`, stock decrement in `product_variants`, and movement audit entry in `stock_movements`.
- **`lib/sales/sale-actions.ts`**:
  - Next.js Server Action invoking `createSaleTransaction()`, revalidating paths (`/sales`, `/inventory`, `/customers`), and returning success/error result.

### Database Layer
- **`supabase/migrations/20261105060000_create_sale_items_table.sql`**:
  - Creates `public.sale_items` with RLS policies and indexes.

---

## 2. Component Hierarchy

```
app/(admin)/sales/new/page.tsx (Server Component)
└── Page Header ("New sale", "Pick the customer and items...")
└── NewSaleWizard (Client Component)
    ├── CustomerSection
    │   ├── CustomerDropdown (with debt indicator)
    │   ├── AddCustomerLink
    │   └── CustomerDebtBanner (if customer selected)
    ├── ItemsSection
    │   ├── SectionHeader ("Items" + "+ Add item" button)
    │   └── LineItemsList
    │       └── SaleLineItemRow (per line item)
    │           ├── ProductSelect
    │           ├── SizeSelect (with price preview)
    │           ├── QuantityStepper (−, input, +)
    │           ├── LineAmountDisplay
    │           ├── RemoveLineButton (disabled if 1 line)
    │           └── StockNote (Green remaining or Red over-stock warning)
    └── SummarySidebar (Sticky aside)
        ├── ItemsCount ("X bottles")
        ├── GrossProfit ("₱XX.XX")
        ├── GrandTotal ("₱XX.XX")
        ├── PaymentStatusSegmentedControl (Paid, Partially Paid, Not Yet Paid)
        ├── AmountPaidInput (Conditional on Partially Paid)
        ├── RemainingBalance ("₱XX.XX")
        ├── OrderStatusSegmentedControl (Pending, Delivered, Picked Up)
        ├── SaveSaleButton (Disabled on error)
        └── SubmissionHelpText
```

---

## 3. Test Plan

- **Unit Tests (`tests/new-sale-calculations.test.ts`)**:
  - Scenario 1: Multi-line sale calculation, grand total ₱560, profit ₱115, stock decrement.
  - Scenario 2: Partial payment, amount paid ₱500, balance ₱700, debt rollup.
  - Scenario 3: Real-time over-stock warning when quantity > stock, disabling save button.
  - Scenario 4: Fast customer pre-fill from query parameter.
  - Edge cases: Minimum quantity 1, removing lines, invalid partial payment amounts, sequential receipt numbering.
