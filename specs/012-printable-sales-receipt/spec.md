# Feature Specification: Printable Official Sales Receipt with POS Thermal Print Layout

**Feature Key**: `ARL-16`  
**Feature Slug**: `012-printable-sales-receipt`  
**Jira Story**: STORY-3.5: Printable Official Sales Receipt with POS Thermal Print Layout  
**Epic**: EPIC-3: Interactive Workflows, Transactions & Business Logic (`ARL-11`)  
**Status**: Ready for Planning  

---

## 1. User Story

**As an** ARLQ store administrator,  
**I want to** generate and print a clean physical receipt styled like a 58mm/80mm POS thermal receipt,  
**so that** I can provide physical proof of purchase and payment stamps to customers.

---

## 2. Business Invariants & Rules

1. **Receipt Monospace Preview (`/receipt/{id}`)**:
   - Styled to replicate a compact 58mm/80mm POS thermal receipt paper roll (`w-[400px]`, `max-w-full`, centered inside a sunken preview container).
   - Monospace typography using Courier Prime (`font-mono`, `'Courier Prime', 'Courier New', monospace`).
   - Store Header:
     - Prominent bold title: **ARLQ Food Condiments Trading**
     - Subtitle: `Official Receipt`
     - Centered alignment with dashed bottom divider.
   - Header Metadata Rows:
     - `Receipt no.`: Bold receipt number (e.g. `ARLQ-01041`).
     - `Date`: Human-readable transaction date (e.g. `Oct 11, 2026`).
     - `Customer`: Customer name right-aligned (e.g. `Mang Tonyo Carinderia`).
   - Line Items Breakdown:
     - Variant description line: `{Product Name} - {Size}` (e.g. `Patis - 1 L`).
     - Sub-row: Left side shows `{quantity} × {unit price}` (e.g. `2 × ₱120.00`), right side shows item line total (e.g. `₱240.00`).
   - Financial Summary:
     - Grand total row: bold `TOTAL` with amount (e.g. `₱1,340.00`).
     - `Amount paid` row with settled payment amount.
     - `Remaining balance` row: rendered prominently with bold amount when balance > 0.
   - Payment Status Stamp:
     - Centered uppercase stamp:
       - `PAID` (rendered in green/success token) when the balance is 0.
       - `PARTIALLY PAID` (rendered in amber/warning token) when partially settled.
       - `NOT YET PAID` (rendered in red/danger token) when no payment has been made.
   - Receipt Footer:
     - Centered message: `Thank you for your business!`
   - Page Navigation & Actions:
     - Breadcrumbs: `Sales` (`/sales`) > `{receipt_number}` (`/sales/{id}`) > `Receipt`.
     - Page Title: `Receipt preview` with subtitle `Review and print.`
     - Header Action Buttons:
       - `Print receipt`: Primary button with printer icon invoking browser `window.print()`.
       - `Back to sale`: Secondary button linking directly to `/sales/{id}`.

2. **Native Browser Print Stylesheet (`@media print`)**:
   - Executing `window.print()` triggers the browser's native print dialog.
   - Print stylesheet rules (`@media print`):
     - Backgrounds set to pure white and ink text set to high-contrast black.
     - Strips all administrative chrome: hides sidebar (`.sidebar`), topbar (`.topbar`), breadcrumbs, page header buttons (`.no-print`, header action bar), and toast notifications (`.toasts`).
     - Expands the receipt wrapper and thermal receipt card to full width (`width: 100%`) without shadow or borders, removing background padding.
     - Keeps dashed dividers crisp (`border-color: #000` or `#ccc`) for thermal printers.
     - Prevents awkward page breaks inside item rows (`break-inside: avoid`).

3. **Fast Navigation Return**:
   - Clicking `Back to sale` returns the admin immediately to `/sales/{id}` without loss of state.
   - Breadcrumb links allow instant navigation to either `/sales/{id}` or the sales ledger `/sales`.

4. **Error & Fallback Handling**:
   - When navigated with an invalid or non-existent sale ID, displays a clean `Receipt not found` error state with a link returning to `/sales`.

---

## 3. Acceptance Criteria & Gherkin Scenarios

### Scenario 1: Thermal receipt monospace preview
- **Given** an admin on a sale detail page (`/sales/{id}`)
- **When** they click "Print receipt"
- **Then** the receipt preview opens at `/receipt/{id}` rendered in monospace Courier Prime font
- **With** store header "ARLQ Food Condiments Trading / Official Receipt", receipt number, date, customer name, itemized rows with quantities and unit prices, grand total, and payment status stamp.

### Scenario 2: Payment status stamp rendering
- **Given** a sale that is fully paid (`balance == 0`)
- **When** viewing the receipt preview
- **Then** a bold uppercase stamp "PAID" is rendered.
- **Given** a sale with remaining balance (`balance > 0` and `amount_paid > 0`)
- **Then** the stamp displays "PARTIALLY PAID" with the remaining balance prominently printed.
- **Given** a sale with zero payment (`amount_paid == 0`)
- **Then** the stamp displays "NOT YET PAID" with the remaining balance prominently printed.

### Scenario 3: Native browser print stylesheet formatting
- **Given** the user on the receipt preview page (`/receipt/{id}`)
- **When** they click "Print receipt"
- **Then** `window.print()` is invoked
- **And** print-specific CSS rules `@media print` hide the topbar, sidebar, action buttons, and background colors, printing exclusively the clean receipt content.

### Scenario 4: Fast navigation return
- **Given** the user in receipt preview mode (`/receipt/{id}`)
- **When** they click "Back to sale"
- **Then** the browser returns directly to `/sales/{id}`.

### Scenario 5: Missing or invalid sale ID
- **Given** an invalid or unknown sale ID
- **When** navigating to `/receipt/{invalid_id}`
- **Then** the system displays "Receipt not found" and a button linking back to "/sales".
