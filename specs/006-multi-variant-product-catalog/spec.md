# Feature Specification: Multi-Variant Product Catalog & Pricing Engine

**Feature Key**: `ARL-8`  
**Feature Slug**: `006-multi-variant-product-catalog`  
**Jira Story**: STORY-2.2: Multi-Variant Product Catalog (Toyo, Suka, Patis) & Pricing Engine  
**Epic**: EPIC-2: Core Domain Entities & Primary CRUD Operations (`ARL-6`)  
**Status**: Ready for Planning  

---

## 1. User Story

**As an** ARLQ store administrator,  
**I want to** manage products (Toyo, Suka, Patis) across 3 standard packaging sizes (350ml, 1L, 1gal) with individual cost and selling prices,  
**so that** unit profit margins and minimum stock thresholds are automatically tracked per variant.

---

## 2. Business Invariants & Rules

1. **Standard Packaging Sizes**:
   - Every product in ARLQ has exactly three standard variant packaging sizes:
     - `350` ("350 ml")
     - `1L` ("1 L")
     - `gal` ("1 gal")
   - Variants cannot exist without a parent product. A product must always have these 3 packaging sizes defined.
2. **Pricing & Unit Profit Margin Engine**:
   - `cost_price` represents unit replenishment/production cost in PHP (e.g., ₱38.00). Must be non-negative (`>= 0`).
   - `selling_price` represents customer retail/wholesale unit price in PHP (e.g., ₱50.00). Must be non-negative (`>= 0`).
   - Unit profit margin is deterministically computed as `profit = selling_price - cost_price` (e.g., ₱50.00 - ₱38.00 = ₱12.00).
   - If `selling_price < cost_price`, profit is negative or zero, but validation ensures neither price can be negative (`>= 0`).
3. **Stock & Threshold Tracking**:
   - `stock_quantity`: integer count of sellable units on hand (`>= 0`).
   - `min_stock_level`: integer threshold flagging low inventory alerts (`>= 0`).
   - When creating a new product at `/products/new`, an optional `opening_stock` (defaults to 0) can be entered per size variant.
4. **Validation via Zod**:
   - Product name: string between 1 and 100 characters, trimmed, required.
   - Category: UUID referencing `categories.id` (or null if uncategorized).
   - Variant costs, prices, minimum stock:
     - `cost_price >= 0`
     - `selling_price >= 0`
     - `min_stock_level >= 0` (integer)
     - `stock_quantity >= 0` (integer)
   - Entering negative values (e.g., `-10.00`) halts submission on both client and server actions with explicit field errors.
5. **Product Deletion Safeguard & Historical Integrity**:
   - Products can be deleted only via a confirmation dialog (`ConfirmDialog`).
   - Confirmation prompt:
     - Title: `Delete {Product Name}?`
     - Message: `"This removes {Product Name} and its three sizes from the product list. Past sales stay in the records."`
     - Confirm button label: `Delete product` (danger variant).
   - Once confirmed, the product and its variants are removed from the active catalog. If sales line items reference variants, historical sales preserve snapshot line item data (preventing foreign key cascade corruption of historical revenue).
   - Toast notification: `"Product deleted"`.
6. **Atomic Transactional Persistence**:
   - Product creation and editing must execute as an atomic transaction: 1 `products` row and 3 `product_variants` rows are committed together.
   - After creation: redirects to `/products` with toast `"Product added"`.
   - After update: redirects to `/products` with toast `"Product saved"`.
7. **Product Catalog UI (`/products`)**:
   - Page Header: Title `Products`, subtitle `Three products, three sizes each: nine sellable items.`, action button `Add product` (`/products/new`).
   - Toolbar: Search input (`Search products or sizes`) dynamically filtering by product name, category name, or size label (case-insensitive).
   - Table Grid:
     - Grouped rows per product.
     - Product column with name and category subtext with `rowSpan="3"` and border separator.
     - Size column: `350 ml`, `1 L`, `1 gal`.
     - Cost: Formatted in Philippine Peso (e.g., `₱14.00`).
     - Selling price: Formatted in Philippine Peso (e.g., `₱20.00`).
     - Profit each: Formatted in Philippine Peso (e.g., `₱6.00`).
     - In stock: Integer quantity.
     - Minimum: Minimum stock alert threshold.
     - Actions column: `rowSpan="3"` with `Edit` link (`/products/[id]/edit`) and `Delete` button.
8. **Strict Semantic Design Tokens**:
   - Zero hardcoded colors.
   - Surface cards: `bg-bg-surface border border-border rounded-[var(--r)]`.
   - Table headers: `text-text-muted text-xs font-semibold`.
   - Primary action buttons: `bg-primary hover:bg-primary-hover text-text-light`.
   - Secondary action buttons: `bg-secondary hover:bg-secondary-hover text-text-primary border border-border`.
   - Danger action buttons: `bg-danger hover:bg-danger/90 text-text-light`.

---

## 3. Gherkin Acceptance Criteria

### Scenario 1: Multi-variant product catalog creation
```gherkin
Feature: Product Catalog Creation
  Scenario: Admin creates a new condiment product with 3 size variants
    Given an admin on "/products/new"
    When they enter Product Name "Toyo"
    And select Category "Soy Sauce"
    And populate prices and minimum stock for 350ml, 1L, and 1gal:
      | size  | cost  | price  | min | opening |
      | 350   | 14.00 | 20.00  | 48  | 96      |
      | 1L    | 38.00 | 50.00  | 30  | 58      |
      | gal   | 125.00| 160.00 | 12  | 17      |
    And submit the form
    Then an atomic database transaction creates 1 "products" record and 3 "product_variants" records
    And the admin is redirected to "/products" with toast "Product added"
```

### Scenario 2: Automatic unit profit computation
```gherkin
Feature: Unit Profit Margin Engine
  Scenario: Catalog table calculates unit profit per variant
    Given a product variant with cost price ₱38.00 and selling price ₱50.00
    When viewing the product catalog table on "/products"
    Then the "Profit each" column displays "₱12.00"
    And the calculation equals selling_price minus cost_price
```

### Scenario 3: Negative price rejection
```gherkin
Feature: Pricing Validation
  Scenario: Admin enters negative selling price
    Given an admin entering a selling price of -10.00 on "/products/new"
    When they attempt to save
    Then Zod validation halts submission
    And displays a field validation error "Price must be greater than or equal to 0"
    And no database transaction is executed
```

### Scenario 4: Product deletion safeguard
```gherkin
Feature: Product Deletion Safeguard
  Scenario: Admin deletes a product with confirmation safeguard
    Given an existing product "Patis"
    When the admin clicks "Delete" on "/products"
    Then a confirmation modal warns: "This removes Patis and its three sizes from the product list. Past sales stay in the records."
    And the dialog displays confirm button "Delete product"
    When the admin confirms deletion
    Then the product and its 3 variants are removed from the active catalog
    And toast notification "Product deleted" is displayed
    And past sales records remain intact
```

---

## 4. Edge Cases & Constraints

1. **Uncategorized Products**:
   - If a category is deleted, `products.category_id` is set to `NULL`.
   - The catalog table displays `"Uncategorized"` in place of the category name without crashing.
2. **Precision & Currency Formatting**:
   - Currency is formatted using Philippine Peso `₱` with two decimal places (e.g. `₱38.00`), matching `mockup/app.js`'s `peso(n)` helper: `₱` + number formatted with commas and decimals.
3. **Empty Catalog State**:
   - If no products exist in the catalog, a friendly empty card is displayed with an "Add your first product" call to action.
4. **Form Reset and Cancellation**:
   - Clicking "Cancel" on `/products/new` or `/products/[id]/edit` safely routes back to `/products` without discarding uncommitted changes unprompted.

