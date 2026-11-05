# Requirements Quality Checklist: Stock-In & Stock-Out Ledger with Movement Audit

**Feature Key**: `ARL-13`  
**Feature Slug**: `008-stock-movement-ledger`  

---

## 1. Requirement Completeness & Coverage

- [x] **User Story Defined**: Explicit user story following Mike Cohn format (As an ARLQ store admin, I want... so that...).
- [x] **Scenario 1 - Warehouse delivery stock in**:
  - Given Toyo 1L currently has 58 bottles in stock.
  - When recording Stock In of 24 units with reason "Restock from warehouse" and delivery note "DR #8841".
  - Then `stock_movements` record created with type "In".
  - And Toyo 1L stock incremented to 82 bottles.
  - And toast confirms `"Stock in saved: Toyo - 1 L now 82"`.
- [x] **Scenario 2 - Damage stock out**:
  - Given Suka 1 gal has 6 bottles in stock.
  - When recording Stock Out of 1 unit with reason "Damaged or spilled" and note "Cracked cap".
  - Then `stock_movements` record created with type "Out".
  - And Suka 1 gal stock decremented to 5 bottles.
  - And toast confirms `"Stock out saved: Suka - 1 gal now 5"`.
- [x] **Scenario 3 - Prevent stock out exceeding available stock**:
  - Given Patis 1 gal has only 14 bottles in stock.
  - When attempting to record Stock Out of 15 bottles.
  - Then submission is halted with error toast `"Only 14 in stock"`.
  - And no database change is executed.
- [x] **Scenario 4 - Movement history filtering**:
  - Given historical movements of types In, Out, and Sale.
  - When viewing `/inventory/history` and selecting "In" from type filter.
  - Then only Stock In movements are displayed with positive signed quantities (`+X`).

---

## 2. Design System & Accessibility (WCAG 2.1 AA)

- [x] **Zero Hardcoded Colors Rule**: Strictly zero inline hex codes and zero default Tailwind color classes.
- [x] **Semantic Tokens**:
  - `bg-primary`, `hover:bg-primary-hover`, `text-text-light` for primary submit.
  - `bg-secondary`, `hover:bg-secondary-hover`, `text-text-primary`, `border-border` for secondary cancel.
  - `bg-success-light text-success border-success-border` for Stock In pills.
  - `bg-accent-light text-accent border-accent-border` for Stock Out pills.
  - `bg-info-light text-info border border-info-border` for Sale pills.
- [x] **Responsive Layout & Forms**:
  - 2-column split layout (`.split`) on desktop with `.card` containers.
  - Clean stacking on mobile devices.
  - Accessible form controls with explicit `<label for="...">`, focus visible rings (`focus:border-border-focus`), and aria labels.
- [x] **Responsive Data Table**:
  - Standard table structure with `<thead>`, `<th>`, `<tbody>`, `<tr>`, and mobile-responsive data labels (`data-label`).

---

## 3. Data Integrity & Validation

- [x] **Zod Validation Schema**: Validates variant selection (`variant_id`), positive integer quantity (`min(1)`), reason enum/string, and optional note.
- [x] **Database Constraints**:
  - `NOT NULL` on `variant_id`, `movement_type`, `quantity`, `reason`.
  - Check constraints: `quantity > 0`, `movement_type IN ('In', 'Out', 'Sale')`.
  - `stock_quantity >= 0` enforced on `product_variants`.
- [x] **Atomic Stock Mutations**: Invariant $S \ge 0$ strictly preserved; impossible to overdraw inventory through concurrent or invalid requests.
- [x] **Fallback In-Memory Store**: Provides reliable in-memory storage for offline development and instant automated unit testing.
