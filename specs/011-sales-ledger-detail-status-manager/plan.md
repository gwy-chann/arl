# Technical Implementation Plan: Sales Ledger, Detail View & Status Manager

**Feature Key**: `ARL-15`  
**Feature Slug**: `011-sales-ledger-detail-status-manager`  
**Epic**: `EPIC-3: Interactive Workflows, Transactions & Business Logic` (`ARL-11`)  

---

## 1. Architectural Approach & Boundaries

### Presentation Layer
- **`app/(admin)/sales/page.tsx`**:
  - Replaces placeholder with production sales ledger page.
  - Server Component fetching all sales and reminder settings.
  - Renders page header with `New sale` button and passes initial data to `SalesLedgerTable`.
- **`components/sales/sales-ledger-table.tsx`**:
  - Client Component handling real-time search (receipt number or customer name) and dropdown filters (`Payment status`, `Order status`).
  - Renders responsive table matching `mockup/index.html` (`tbl-cards`), with semantic tokens for status pills, red balance alerts, and row navigation to `/sales/{id}`.
- **`app/(admin)/sales/[id]/page.tsx`**:
  - Server Component loading sale by ID with associated line items, customer details, and system settings.
  - Renders 404/not found UI if sale does not exist.
  - Assembles the 2-column layout with Overdue banner, Items table, Customer card, Payment manager, and Order manager.
- **`components/sales/overdue-alert-banner.tsx`**:
  - Displays alert banner when `balance > 0` and `days_unpaid >= reminder_days`.
  - Matches mockup notice styling with semantic red token styling.
- **`components/sales/sale-payment-manager.tsx`**:
  - Client component for updating payment terms (Paid, Partially Paid, Not Yet Paid).
  - Handles dynamic partial payment input and client-side validation.
  - Invokes `updateSalePaymentAction()`, updates balance display, and triggers confirmation toast.
- **`components/sales/sale-order-manager.tsx`**:
  - Client component for updating order fulfillment status (`Pending`, `Delivered`, `Picked Up`).
  - Invokes `updateSaleOrderStatusAction()` and triggers confirmation toast.

### Domain & Services Layer
- **`lib/sales/sale-contracts.ts`**:
  - Zod validation schemas for `updateSalePaymentSchema` and `updateSaleOrderStatusSchema`.
  - Extended `SaleTransactionDTO` including customer contact details and overdue fields.
- **`lib/sales/sale-service.ts`**:
  - Pure calculation helpers:
    - `getDaysUnpaid(createdAt: string, asOfDate?: Date): number`
    - `isSaleOverdue(balance: number, createdAt: string, reminderDays: number, asOfDate?: Date): boolean`
    - `getOverdueDays(createdAt: string, reminderDays: number, asOfDate?: Date): number`
  - Mutation methods:
    - `updateSalePayment(saleId: string, paymentStatus: PaymentStatus, amountPaid?: number)`:
      - Updates `amount_paid`, `balance`, `payment_status` in Supabase and memory.
      - Synchronizes customer debt rollup.
    - `updateSaleOrderStatus(saleId: string, orderStatus: OrderStatus)`:
      - Updates `order_status` in Supabase and memory.
- **`lib/sales/sale-actions.ts`**:
  - Server Actions:
    - `updateSalePaymentAction(input: UpdateSalePaymentInput)`
    - `updateSaleOrderStatusAction(input: UpdateSaleOrderStatusInput)`
    - Revalidates paths: `/sales`, `/sales/[id]`, `/customers`, `/customers/[id]`, `/dashboard`.

---

## 2. Component Hierarchy

```
app/(admin)/sales/page.tsx (Server Component)
└── Page Header ("Sales", "All recorded transactions.", "+ New sale" button)
└── SalesLedgerTable (Client Component)
    ├── Toolbar
    │   ├── SearchBox (Receipt / Customer search)
    │   ├── PaymentFilterSelect ("All payments", "Paid", "Partially Paid", "Not Yet Paid")
    │   └── OrderFilterSelect ("All orders", "Pending", "Delivered", "Picked Up")
    └── TableContainer
        └── Table (tbl-cards)
            ├── Thead (Receipt, Date, Customer, Total, Balance, Payment, Order)
            └── Tbody
                └── Row (Clickable -> /sales/{id})
                    ├── ReceiptCell (ARLQ-XXXXX)
                    ├── DateCell (fmtDate)
                    ├── CustomerCell (Customer name)
                    ├── TotalCell (PHP currency)
                    ├── BalanceCell (PHP currency, red if > 0)
                    ├── PaymentCell (StatusPill + OverduePill if overdue)
                    └── OrderCell (StatusPill info/warn)

app/(admin)/sales/[id]/page.tsx (Server Component)
└── Breadcrumbs ("Sales" > "ARLQ-XXXXX")
└── Header (Receipt number, "Date · Customer", "Print receipt" action button)
└── Two-Column Layout (cols / stack + aside)
    ├── MainStack (Left column)
    │   ├── OverdueAlertBanner (if balance > 0 and days_unpaid >= reminder_days)
    │   ├── ItemsSection (Card)
    │   │   ├── CardHeader ("Items")
    │   │   └── ItemsTable (Product size, Qty, Unit price, Line total, Profit)
    │   │       └── Tfoot (Total revenue & gross profit summary)
    │   └── CustomerCard (Card)
    │       └── DefinitionList (Customer link, Phone, Address)
    └── AsideStack (Right column)
        ├── SalePaymentManager (Card)
        │   ├── CardHeader ("Payment" + payment status pill)
        │   ├── SummaryLines (Total, Amount paid, Remaining balance)
        │   ├── SegmentedControl (Paid, Partially Paid, Not Yet Paid)
        │   ├── AmountPaidInput (shown if Partially Paid)
        │   └── SavePaymentButton ("Save payment")
        └── SaleOrderManager (Card)
            ├── CardHeader ("Order" + order status pill)
            ├── SegmentedControl (Pending, Delivered, Picked Up)
            └── SaveOrderButton ("Save order status")
```
