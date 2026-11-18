# Feature Specification: In-Form Category Creation & Dynamic Product Variant Management

**Feature Key**: `ARL-38`  
**Feature Slug**: `027-dynamic-product-variants-in-form-categories`  
**Jira Story**: STORY-2.5: In-Form Category Creation & Dynamic Product Variant Management  
**Epic**: EPIC-2: Core Domain Entities & Primary CRUD Operations (`ARL-6`)  
**Status**: Ready for Planning  

---

## 1. User Story

**As an** ARLQ Store Administrator,  
**I want to** create new categories directly inside the product creation workflow and add new or custom packaging variants to new or existing products,  
**so that** the store can expand product lines (new condiment categories) and offer flexible bottle sizes or wholesale packages without leaving the product form or being restricted to hardcoded packaging dimensions.

---

## 2. Context & Problem Statement

Currently, the product management system enforces two rigid constraints:

1. **Static Category Selection in Product Form**:
   - When creating or editing a product (`/products/new` or `/products/[id]/edit`), the Category input is a closed dropdown containing only pre-existing categories.
   - If an administrator wants to register a product under a brand new category (e.g., *Cooking Oil*, *Specialty Blends*, *Chili Sauce*), they must navigate away to `/products/categories`, create the category, and then restart the product creation process, losing all entered form state.

2. **Hardcoded Variant Sizes & Fixed Array Length**:
   - PostgreSQL table `product_variants` enforces `CHECK (size IN ('350', '1L', 'gal'))`.
   - Zod contract `productInputSchema` strictly requires exactly 3 variants (`.length(3)`).
   - Administrators cannot add a new packaging variant (e.g., 500ml, 20L drum, sachet 100ml) to an existing product (e.g., *Toyo*), nor can they introduce products with a non-standard number of variants (e.g., single-size items or 4+ sizes).

---

## 3. Business Invariants & Rules

1. **Dynamic Packaging Variants**:
   - Products are no longer restricted to exactly 3 sizes or fixed enum values (`'350'`, `'1L'`, `'gal'`).
   - A product must have at least one variant (`min(1)`).
   - Each variant has a non-empty `size` label (e.g., "350 ml", "1 L", "1 gal", "500 ml", "20 L drum", "Sachet 100ml").
   - Unique packaging constraint: Within a single product, each variant size label must be unique (case-insensitive trimmed comparison). Duplicate variant sizes on the same product are strictly prohibited.
2. **Pricing & Unit Profit Margin Engine**:
   - `cost_price`: non-negative number (`>= 0`) representing unit replenishment or production cost in PHP.
   - `selling_price`: non-negative number (`>= 0`) representing customer retail or wholesale selling price in PHP.
   - Unit profit margin is computed dynamically: `profit = selling_price - cost_price`.
   - Numeric constraints: `min_stock_level >= 0` (integer), `opening_stock >= 0` (integer).
3. **Historical Data Integrity**:
   - Existing sales records reference `variant_id` in `sale_items`.
   - Relaxing the `size` check constraint does not alter existing variants or sales records.
   - Adding a new variant to an existing product inserts a new row into `product_variants` without disrupting existing variant IDs.
   - If an existing variant is updated, its prices and minimum stock are modified. Existing stock quantities and transaction histories remain intact.
4. **In-Form Inline Category Creation**:
   - An administrator can trigger an inline category creation prompt directly from the Category selector area.
   - Creating a category persists immediately via `createCategoryAction`.
   - Upon successful creation, the new category is appended to the local category options and automatically selected.
   - All other entered product form data (name, variants, prices, stock levels) is strictly preserved without reset or reload.
   - Duplicate category validation: If the category name already exists, an informative error is displayed without dismissing the inline dialog.
5. **UI & Accessibility Invariants**:
   - Zero hardcoded colors: all UI elements consume design system tokens (`bg-bg-surface`, `bg-bg-base`, `text-text-primary`, `bg-primary`, `border-border`, etc.).
   - Modals/popovers must support keyboard accessibility (Escape to dismiss, Tab focus trap, Enter to confirm, aria-modal, aria-labelledby).
   - Responsive layout: Dynamic variant table must be horizontally scrollable on mobile and cleanly aligned on desktop.

---

## 4. Acceptance Criteria & Gherkin Scenarios

### Scenario 1: Inline Category Creation in Product Form
- **Given** an administrator is on the Add or Edit Product form (`/products/new` or `/products/[id]/edit`)
- **When** they click "+ Add new category" adjacent to or inside the category selector
- **Then** an accessible inline modal or popover dialog appears prompting for the category name
- **When** they type a valid category name (e.g., "Cooking Oil") and confirm
- **Then** the category is immediately saved to the `categories` database table
- **And** the category selector automatically updates its options and pre-selects "Cooking Oil"
- **And** all previously entered product information (e.g., product name, entered variant prices) remains completely preserved.

### Scenario 2: Adding a New Variant to an Existing Product
- **Given** an existing product in the catalog (e.g., *Toyo* with standard variants 350ml, 1L, 1gal)
- **When** the administrator navigates to `/products/[id]/edit` and clicks "+ Add variant"
- **Then** a new editable variant row is added to the size variants table
- **When** the administrator enters size "500 ml", cost price `22.00`, selling price `30.00`, minimum stock `20`, and saves
- **Then** the new variant is persisted into `product_variants` linked to the product
- **And** existing variant records and historical sales links remain intact and functional.

### Scenario 3: Dynamic Variant Rows on Product Creation
- **Given** an administrator is creating a new product at `/products/new`
- **When** the form loads
- **Then** it initializes with standard default packaging sizes or clean starter rows
- **When** the administrator clicks "+ Add variant", an additional variant row appears
- **When** the administrator clicks the remove button ("Delete / Remove") on an unwanted variant row
- **Then** that row is removed from the list, provided at least one variant row remains.

### Scenario 4: Validation & Duplicate Prevention
- **Given** a product form with multiple variant rows
- **When** the administrator enters duplicate size labels for the same product (e.g., two "1 L" rows)
- **Then** client and server-side validation flags the duplicate variant with the error "Variant sizes must be unique for each product"
- **And** the form submission is prevented until the duplicate is corrected.

### Scenario 5: Downstream System Compatibility
- **Given** new products or variants created with custom packaging labels (e.g., "500 ml", "20 L Drum")
- **When** viewing the Products catalog (`/products`), POS sale item selector (`/sales/new`), Stock Monitor (`/inventory`), or Stock Movement Ledger (`/inventory/movements`)
- **Then** the custom packaging label is cleanly formatted and displayed without errors or missing data.
