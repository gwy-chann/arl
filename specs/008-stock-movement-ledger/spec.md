# Feature Specification: Stock-In & Stock-Out Ledger with Movement Audit

**Feature Key**: `ARL-13`  
**Feature Slug**: `008-stock-movement-ledger`  
**Jira Story**: STORY-3.2: Stock-In & Stock-Out Ledger with Movement Audit  
**Epic**: EPIC-3: Inventory & Warehouse Management  
**Status**: Ready for Planning  

---

## 1. User Story

**As an** ARLQ store administrator,  
**I want to** record Stock In (warehouse deliveries, customer returns) and Stock Out (damages, giveaways, repacking spills) with standard reason codes and notes, and view a complete historical movement ledger,  
**so that** all inventory changes are traceable.

---

## 2. Business Invariants & Domain Rules

1. **Inventory Balance Mutability & Invariants**:
   - Every product variant (`product_variants`) has a live integer `stock_quantity` ($\ge 0$).
   - **Stock In**: Increases the variant's `stock_quantity` by `quantity`:
     $$S_{\text{new}} = S_{\text{old}} + Q \quad (Q \ge 1)$$
   - **Stock Out**: Decreases the variant's `stock_quantity` by `quantity`:
     $$S_{\text{new}} = S_{\text{old}} - Q \quad (1 \le Q \le S_{\text{old}})$$
   - **Insufficient Stock Safeguard**: Stock Out is strictly forbidden from driving `stock_quantity` negative. If an administrator attempts to deduct $Q > S_{\text{old}}$, the system halts submission, executes no database mutation, and triggers an error notification: `"Only {S_old} in stock"`.

2. **Audit Ledger & Movement Records (`stock_movements`)**:
   - Every stock adjustment creates an immutable audit row in `stock_movements`.
   - Fields:
     - `id`: Unique identifier (UUID or deterministic ID).
     - `variant_id`: Foreign key reference to `product_variants(id)`.
     - `movement_type`: `'In'` or `'Out'` (also supports historical `'Sale'` deductions).
     - `quantity`: Positive integer ($\ge 1$).
     - `reason`: Standardized operational reason code.
     - `note`: Optional administrative reference or delivery receipt text (e.g. `"DR #8841"`, `"Cracked cap"`).
     - `created_at`: ISO 8601 timestamp with timezone.
   - For display in tables, the composite note is formatted as:
     - `"{reason}: {note}"` when an optional note is present.
     - `"{reason}"` when no additional note was provided.
     - `"Sale {receipt_number}"` for sale-driven deductions.

3. **Standardized Reason Codes**:
   - **Stock In (Inbound)**:
     - `"Restock from warehouse"`
     - `"Return from customer"`
     - `"Correction"`
   - **Stock Out (Outbound Non-Sale)**:
     - `"Damaged or spilled"`
     - `"Sample or giveaway"`
     - `"Used for repacking"`
     - `"Correction"`

4. **Action Feedback & Notifications**:
   - Stock In Success Toast: `"Stock in saved: {Product Name} - {Size Label} now {new_stock}"` (e.g. `"Stock in saved: Toyo - 1 L now 82"`).
   - Stock Out Success Toast: `"Stock out saved: {Product Name} - {Size Label} now {new_stock}"` (e.g. `"Stock out saved: Suka - 1 gal now 5"`).
   - Insufficient Stock Toast: `"Only {available_stock} in stock"`.

5. **Movement Ledger & Real-Time Filtering (`/inventory/history`)**:
   - Route: `/inventory/history`.
   - Table columns: `Date`, `Product`, `Type`, `Qty`, `Note`.
   - Signed Quantities: Inbound movements render with a leading `+` (e.g. `+24`, `+96`). Outbound and sale movements render with a leading `-` (e.g. `-1`, `-6`).
   - Movement Type Filtering:
     - Dropdown options: `"All movements"` (value `""`), `"In"`, `"Out"`.
     - Selecting `"In"` displays exclusively Stock In transactions with positive signed quantities.
     - Selecting `"Out"` displays exclusively Outbound transactions (damages, giveaways, repacking, corrections, sales).
   - Real-Time Search Query: Filters rows by product name, variant size label, or note content in real time.

6. **Inventory Module Navigation & Tab Layout**:
   - Persistent sub-navigation tab bar across inventory views:
     - `Overview` (`/inventory`)
     - `Stock in` (`/inventory/in`)
     - `Stock out` (`/inventory/out`)
     - `Low stock alerts` (`/inventory/low`)
     - `Movement history` (`/inventory/history`)

7. **Operational Form Layout & Recent Activity**:
   - Routes `/inventory/in` and `/inventory/out` utilize a 2-column split layout (`.split`):
     - Left column: The Stock In or Stock Out form card with product & size selector, quantity input, date, reason selector, and optional note input.
     - Right column: "Recent stock in" or "Recent stock out" card listing the 5 most recent movements of the respective type.

8. **Strict Semantic Design Tokens (Zero Hardcoded Colors Rule)**:
   - Positive / Inbound badge: `bg-success-light text-success border border-success-border`.
   - Outbound / Warning badge: `bg-accent-light text-accent border border-accent-border`.
   - Sale / Info badge: `bg-info-light text-info border border-info-border`.
   - Form buttons, inputs, surfaces, and borders consume only semantic tokens (`bg-primary`, `bg-secondary`, `bg-bg-surface`, `border-border`, etc.).

---

## 3. Gherkin Acceptance Criteria

```gherkin
Feature: Stock-In & Stock-Out Ledger with Movement Audit (ARL-13)

  Scenario 1: Warehouse delivery stock in
    Given Toyo 1L currently has 58 bottles in stock
    When the admin records Stock In of 24 units with reason "Restock from warehouse" and delivery note "DR #8841"
    Then a stock_movements row is created with type "In"
    And Toyo 1L stock is incremented to 82 bottles
    And a toast confirms "Stock in saved: Toyo - 1 L now 82"

  Scenario 2: Damage stock out
    Given Suka 1 gal has 6 bottles in stock
    When the admin records Stock Out of 1 unit with reason "Damaged or spilled" and note "Cracked cap"
    Then a stock_movements row is created with type "Out"
    And Suka 1 gal stock is decremented to 5 bottles
    And a toast confirms "Stock out saved: Suka - 1 gal now 5"

  Scenario 3: Prevent stock out exceeding available stock
    Given Patis 1 gal has only 14 bottles in stock
    When the admin attempts to record Stock Out of 15 bottles
    Then the system blocks submission with error toast "Only 14 in stock"
    And no database change is executed

  Scenario 4: Movement history filtering
    Given historical movements of types In, Out, and Sale
    When the admin views "/inventory/history" and selects "In" from the type filter
    Then only Stock In movements are displayed with positive signed quantities ("+X")
```
