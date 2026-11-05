# Technical Research & Architecture Decisions: Sales Ledger, Detail View & Status Manager

**Feature Key**: `ARL-15`  
**Feature Slug**: `011-sales-ledger-detail-status-manager`  
**Epic**: `EPIC-3: Interactive Workflows, Transactions & Business Logic` (`ARL-11`)  

---

## 1. Stack Alignment & Context

- **Framework**: Next.js 16 (App Router) with React 19 Client & Server Components, leveraging React Server Components (RSC) for initial ledger and detail data delivery and client interactivity for searching, filtering, and instant segmented status updates.
- **Database & Storage**: Supabase PostgreSQL with SSR authentication (`@supabase/ssr`) and authenticated admin role enforcement. Fallback in-memory storage for testability and offline resilience.
- **Styling**: Tailwind CSS v4 using semantic design tokens (`lib/tokens.ts`, `app/globals.css`, zero hardcoded hex/RGB).
- **Mockup Reference**:
  - `mockup/index.html` & `mockup/app.js` lines 438–477 (`salesList()`, `saleDetail()`, `A.sf()`, `A.sd()`, `A.savePay()`, `A.saveOrder()`).
  - `mockup/styles.css` lines 286–292 (`.pill.ok`, `.pill.warn`, `.pill.bad`, `.pill.info`), lines 295–310 (`.seg`, `.seg label`), lines 220–235 (`.cols`, `.stack`, `.sum-line`, `.notice`).

---

## 2. Architectural Analysis & Decisions

### Decision 1: Hybrid Server/Client Rendering for Ledger (`/sales`)
- **Problem**:
  The sales transaction ledger requires both SEO/SSR capability for direct bookmarking and snappy real-time client filtering (search by customer name/receipt number, payment filter, order filter) without making roundtrips to the server for every keystroke.
- **Decision**:
  - Server Component `app/(admin)/sales/page.tsx` fetches the sales list and settings using `SaleService` and `SettingsService`.
  - Passes data to Client Component `SalesLedgerTable` (`components/sales/sales-ledger-table.tsx`), which provides instant in-browser text search and dropdown filtering.
  - Clicking any row uses `useRouter().push('/sales/' + sale.id)` or semantic clickable row links.

### Decision 2: Status Manager Architecture on Detail Page (`/sales/[id]`)
- **Problem**:
  Admin needs to update payment status (Paid, Partially Paid, Not Yet Paid with amount paid) and order fulfillment status (Pending, Delivered, Picked Up) independently. Mutations must revalidate paths, update Supabase, update customer debt rollup, and display toast notifications.
- **Decision**:
  - Server Component `app/(admin)/sales/[id]/page.tsx` loads the sale by ID, itemized line items, customer details, and system settings (reminder threshold, admin mobile).
  - Two dedicated client management components:
    - `SalePaymentManager` (`components/sales/sale-payment-manager.tsx`): Manages payment segmented control, amount paid input, calculation of remaining balance, and calls server action `updateSalePaymentAction()`.
    - `SaleOrderManager` (`components/sales/sale-order-manager.tsx`): Manages order fulfillment segmented control and calls server action `updateSaleOrderStatusAction()`.
  - When payment is updated to "Paid", remaining balance becomes 0 and the Overdue Alert Banner is immediately dismissed.

### Decision 3: Overdue Sale Detection Logic & Time Calculation
- **Problem**:
  AC 2 requires: "Given a sale with balance > 0 that has been unpaid for 9 days (threshold = 7 days), when viewing the sale detail page, an alert banner is displayed: 'Overdue by 2 days past the reminder limit. Unpaid for 9 days. An SMS reminder was sent...'".
- **Decision**:
  - Compute `daysUnpaid`: Difference in calendar days between `created_at` and current time (or an optional `asOfDate` for test deterministic verification).
  - Formula:
    ```ts
    const daysUnpaid = Math.max(0, Math.floor((asOf.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
    const isOverdue = balance > 0 && daysUnpaid >= reminderThresholdDays;
    const daysOverdue = Math.max(0, daysUnpaid - reminderThresholdDays);
    ```
  - If `isOverdue` is true, render `OverdueAlertBanner` component with the exact copy matching mockup and Jira acceptance criteria.

### Decision 4: Customer Debt Rollup Synchronization
- **Problem**:
  When a sale's payment status or amount paid is updated (e.g. from Unpaid ₱1,340.00 to Paid), the customer's total outstanding balance must decrease by ₱1,340.00.
- **Decision**:
  - Update `sales` row in Supabase: `amount_paid`, `payment_status`, `updated_at`.
  - Update in-memory customer ledger / debt records via `recordCustomerPaymentUpdate()`.
  - Revalidate `/sales`, `/sales/[id]`, `/customers`, `/customers/[id]`, `/dashboard`.
