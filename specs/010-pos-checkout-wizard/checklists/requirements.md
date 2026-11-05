# Requirements Quality Checklist: POS-Style Multi-Line Checkout Wizard

**Feature Key**: `ARL-14`  
**Feature Slug**: `010-pos-checkout-wizard`  
**Jira Story**: STORY-3.3: POS-Style Multi-Line New Sale Checkout Wizard with Stock Validation  

---

## 1. Requirement Completeness & Coverage

- [x] **Customer Selection**: Customer dropdown lists all customers with outstanding debt indicators (`(owes ₱XXX.XX)`).
- [x] **Pre-Selected Customer Support**: URL search parameters `?customerId=` and `?customer=` automatically pre-fill the customer.
- [x] **Quick Add Customer Link**: Provides shortcut link to `/customers/new`.
- [x] **Multi-Line Order Editing**: Allows adding multiple condiment line items across products and packaging sizes.
- [x] **Quantity Stepper Controls**: Supports `−` and `+` steppers and direct numeric input (minimum: 1).
- [x] **Line Removal**: Allows removing individual line items, with removal disabled when only 1 item remains.
- [x] **Real-Time Stock Warning**: Immediately flags `<b class="text-danger">Only X in stock.</b> Lower the quantity.` and disables checkout when quantity > stock.
- [x] **Live Calculation Engine**: Computes bottle count, total retail amount, Wholesale COGS, and Gross Profit in real time.
- [x] **Payment Status Switching**: Supports `Paid`, `Partially Paid`, and `Not Yet Paid` with reactive remaining balance calculation.
- [x] **Order Status Management**: Segmented controls for `Pending`, `Delivered`, and `Picked Up`.
- [x] **Atomic Stock Deduction**: Automatically decreases variant stock quantity upon checkout confirmation.
- [x] **Stock Movement Audit Log**: Inserts `'Sale'` audit movement with reason and note containing the receipt number.
- [x] **Sequential Receipt Generation**: Allocates sequential identifier formatted as `ARLQ-XXXXX`.
- [x] **User Feedback & Redirection**: Flashes toast notification and routes to the created sale transaction ledger / detail view.

---

## 2. Design System & Aesthetic Tokens

- [x] **Zero Hardcoded Colors**: Employs semantic token classes (`bg-bg-surface`, `bg-bg-input`, `text-text-primary`, `text-danger`, `border-border`, etc.).
- [x] **Mockup Fidelity**: Strictly aligns with `mockup/index.html` lines 400–437 and `mockup/styles.css` classes (`.split`, `.stack`, `.summary`, `.line-item`, `.stepper`, `.seg`, `.amt`).
- [x] **Responsive Layout**: Two-column split on desktop (stack on left, summary sidebar on right), collapsible to single stacked layout on mobile.
- [x] **Accessible Controls**: All inputs have proper labels, `aria-label` attributes on icon buttons, and color contrast complies with WCAG 2.1 AA.
