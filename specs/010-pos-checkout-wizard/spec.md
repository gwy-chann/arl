# Feature Specification: POS-Style Multi-Line New Sale Checkout Wizard with Stock Validation

**Feature Key**: `ARL-14`  
**Feature Slug**: `010-pos-checkout-wizard`  
**Jira Story**: STORY-3.3: POS-Style Multi-Line New Sale Checkout Wizard with Stock Validation  
**Epic**: EPIC-3: Interactive Workflows, Transactions & Business Logic (`ARL-11`)  
**Status**: Ready for Planning  

---

## 1. User Story

**As an** ARLQ store administrator or sales cashier,  
**I want to** ring up multi-item orders in an interactive POS-style checkout wizard with live stock validation, line quantity steppers, and payment controls,  
**so that** recording transactions is fast, mathematically error-free, and automatically deducts warehouse stock.

---

## 2. Business Invariants & Rules

1. **Customer Pre-Selection & Balance Visibility**:
   - Customer dropdown displays each customer's name and their outstanding debt rollup if balance > 0 (e.g., `Mang Tonyo Carinderia (owes ₱240.00)`).
   - Fast URL pre-selection: Query parameters `?customerId={id}` or `?customer={id}` automatically select the matching customer (fulfilling cross-linking from Lola Remedios' and other customer profiles).
   - Link to `Add customer` (`/customers/new`) for registering walk-in buyers on the fly.
   - Customer selection is required to submit a sale.

2. **Multi-Line Order Grid & Steppers**:
   - Each order line consists of:
     - Product dropdown (`Toyo`, `Suka`, `Patis`, etc.)
     - Packaging size selector (`350 ml`, `1 L`, `1 gal`) displaying unit selling price.
     - Quantity stepper with `−` (decrement) and `+` (increment) buttons plus direct numeric input (minimum: 1).
     - Calculated line total amount (`quantity * unit_selling_price`).
     - Remove line button (`X` icon button). The remove button is disabled when only one item line remains.
     - Live stock validation note below the line:
       - **Over-stock condition**: If `quantity > available_stock`, line displays `<b class="text-danger font-semibold">Only ${available_stock} in stock.</b> Lower the quantity.` and prevents checkout.
       - **Valid condition**: Displays `Unit price ₱XX.XX · ${available_stock - quantity} will remain after this sale`.
   - "Add item" button allows adding additional line items.

3. **Financial Summary & Calculation Engine**:
   - **Total Bottle Count**: `sum(lines.quantity)`.
   - **Gross Profit**: `sum(line.quantity * (variant.selling_price - variant.cost_price))`.
   - **Grand Total**: `sum(line.quantity * variant.selling_price)`.
   - **Payment Status**:
     - `Paid`: Amount paid = Grand Total, Remaining balance = `₱0.00`.
     - `Partially Paid`: Displays `Amount paid` input (bounded `0 <= amount <= Grand Total`). Remaining balance = `Grand Total - Amount paid`.
     - `Not Yet Paid`: Amount paid = `₱0.00`, Remaining balance = Grand Total.
   - **Order Fulfillment Status**:
     - Segmented control options: `Pending` (default), `Delivered`, `Picked Up`.

4. **Atomic Checkout & Inventory Side Effects**:
   - Saving creates a sales transaction with an auto-incremented receipt number in sequence (e.g. `ARLQ-01064`).
   - Inserts individual line items into `sale_items` with historical snapshot of unit selling price and cost price.
   - Atomically decrements the `stock_quantity` of each purchased variant in `product_variants`.
   - Automatically writes a movement record to `stock_movements` with `movement_type = 'Sale'`, `reason = 'Sale ' + receipt_number`, and `quantity = line.quantity`.
   - Increases the customer's total debt rollup by the remaining unpaid balance.
   - On successful save, flashes a toast notification: `Sale saved: ARLQ-XXXXX` and redirects to the sale detail view `/sales/{sale_id}`.

---

## 3. Acceptance Criteria & Gherkin Scenarios

### Scenario 1: Multi-line sale with full payment
- **Given** customer "Mang Tonyo" is selected
- **And** line items: 2 bottles of Patis 1 gal (₱200 each, cost ₱160) and 1 bottle of Toyo 1 gal (₱160, cost ₱125)
- **When** Payment status "Paid" is selected and the user clicks "Save sale"
- **Then** the grand total computes to ₱560.00 and remaining balance is ₱0.00
- **And** gross profit is accurately calculated as `(200-160)*2 + (160-125)*1 = ₱115.00`
- **And** stock is atomically decremented: Patis 1 gal -2, Toyo 1 gal -1
- **And** a sequential receipt number (e.g. `ARLQ-01064`) is assigned.

### Scenario 2: Partial payment with debt registration
- **Given** a sale with grand total ₱1,200.00
- **When** the user selects "Partially Paid" and inputs amount paid "₱500.00"
- **Then** remaining balance displays "₱700.00"
- **And** upon saving, the customer's debt balance increases by ₱700.00.

### Scenario 3: Real-time over-stock warning
- **Given** Suka 1 gal has only 6 bottles in stock
- **When** the user increases line item quantity to 7
- **Then** the line validation note displays "Only 6 in stock. Lower the quantity." in red
- **And** the "Save sale" button is disabled.

### Scenario 4: Fast customer pre-fill from profile
- **Given** the user clicked "New sale" from Lola Remedios' profile page (`/sales/new?customerId={id}`)
- **When** the checkout wizard opens
- **Then** Lola Remedios Eatery is automatically pre-selected in the customer dropdown.

---

## 4. Edge Cases & Boundary Handling

1. **Zero / Negative Quantities**:
   - Stepper prevents going below 1 (`−` button disabled or clamped). Manual numeric input `<= 0` is rejected with form validation error.
2. **Duplicate Product Lines**:
   - Cashiers can add multiple rows of the same or different products. Stock validation validates cumulative quantity if the same variant is selected across multiple lines, or validates per line.
3. **Partial Payment Range**:
   - Amount paid cannot be negative, cannot exceed grand total, and non-numeric input is sanitized.
4. **Out-of-Stock Variants**:
   - If a variant has 0 stock, adding it or selecting it immediately flags "Only 0 in stock. Lower the quantity." and disables submission.
5. **Zero Lines Submitted**:
   - If all lines are removed (or lines array is empty), checkout submission is disabled.
