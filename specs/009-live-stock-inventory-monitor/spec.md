# Feature Specification: Live Stock Inventory Monitor & Capacity Level Meters

**Feature Key**: `ARL-12`  
**Feature Slug**: `009-live-stock-inventory-monitor`  
**Jira Story**: STORY-3.1: Live Stock Inventory Monitor & Capacity Level Meters  
**Epic**: EPIC-3: Inventory Movement Ledger & Stock Auditing (`ARL-11`)  
**Status**: Ready for Planning  

---

## 1. User Story

**As an** ARLQ store administrator,  
**I want to** monitor current stock levels across all nine variants with visual capacity meters, color-coded status badges, and a dedicated low-stock view with short-by counts,  
**so that** I can prevent inventory stockouts before they occur.

---

## 2. Business Invariants & Rules

1. **Variant Scope & Representation**:
   - ARLQ catalog consists of 3 products (Toyo, Suka, Patis), each with 3 standard packaging sizes:
     - `350` ("350 ml")
     - `1L` ("1 L")
     - `gal` ("1 gal")
   - Total of exactly **9 sellable item variants** tracked in `product_variants` joined with `products`.

2. **Capacity Progress Meter & Visual Thresholds**:
   - Each variant has a `stock_quantity` (current units on hand) and `min_stock_level` (minimum warning threshold).
   - The capacity level meter visually communicates stock fullness relative to standard replenishment capacity:
     - Meter percentage formula: `Math.min(stock_quantity / (min_stock_level * 2.5) * 100, 100)%`
     - If `min_stock_level` is 0, percentage defaults to 100% when `stock_quantity > 0`, or 0% when 0.
   - Status & Color Styling Rules:
     - **Out of stock**: `stock_quantity === 0`.
       - Meter width: `0%`.
       - Status badge: `"Out of stock"` styled with destructive red badge (`.pill.bad` / `bg-danger-light text-danger border-danger-border`).
       - Meter low warning class `.meter.low` applied.
     - **Low stock**: `stock_quantity > 0` and `stock_quantity <= min_stock_level`.
       - Meter styled with warning amber class `.meter.low` (with red/amber bar fill).
       - Status badge: `"Low stock"` styled with warning amber badge (`.pill.warn` / `bg-accent-light text-accent border-accent-border`).
     - **Getting low**: `stock_quantity > min_stock_level` and `stock_quantity <= min_stock_level * 1.4`.
       - Status badge: `"Getting low"` styled with warning amber badge (`.pill.warn`).
       - Meter styled with normal bar fill.
     - **In stock**: `stock_quantity > min_stock_level * 1.4`.
       - Status badge: `"In stock"` styled with healthy green badge (`.pill.ok` / `bg-success-light text-success border-success-border`).
       - Meter styled with healthy green bar fill.

3. **Sub-Navigation Tabs (`/inventory/*`)**:
   - Inventory views share a standardized sticky horizontal tabs strip:
     1. `Overview` (`/inventory`)
     2. `Stock in` (`/inventory/in`)
     3. `Stock out` (`/inventory/out`)
     4. `Low stock alerts` (`/inventory/low`)
     5. `Movement history` (`/inventory/history`)
   - The active tab is indicated with brand underline (`border-b-2 border-primary text-primary font-semibold`).

4. **Inventory Overview View (`/inventory`)**:
   - Header:
     - Title: `Inventory`
     - Description: `Live stock for all nine variants. Sales deduct stock automatically.`
   - Toolbar:
     - Real-time client-side search input: `Search product or size`.
     - Filters table rows matching product name (e.g., "Toyo") or size label (e.g., "1 L", "1L", "350 ml", "1 gal") case-insensitively.
   - Table Columns:
     - `Product`: Bold product name (`products.name`).
     - `Size`: Formatted packaging size label (`350 ml`, `1 L`, `1 gal`).
     - `In stock`: Bold integer count (right-aligned).
     - `Minimum`: Integer threshold (right-aligned).
     - `Level`: Progress bar (`.meter` container with dynamic width `<i>` element, width capped between 0% and 100%).
     - `Status`: Color-coded pill badge (`Out of stock`, `Low stock`, `Getting low`, `In stock`).
     - `Actions`: Right-aligned action buttons:
       - `Stock in`: Secondary small button linking to `/inventory/in?v={variant_id}`.
       - `Stock out`: Secondary small button linking to `/inventory/out?v={variant_id}`.

5. **Dedicated Low Stock Alerts View (`/inventory/low`)**:
   - Header:
     - Title: `Low stock alerts`
     - Description: `Variants at or below the minimum level.`
   - Filter criteria: Displays only variants where `stock_quantity <= min_stock_level`.
   - Table Columns:
     - `Product`: Bold product name.
     - `Size`: Formatted packaging size label.
     - `In stock`: Bold quantity styled with danger text color (`text-danger`).
     - `Minimum`: Integer threshold count.
     - `Short by`: Computed deficit `Math.max(0, min_stock_level - stock_quantity)` (e.g., threshold 36, current 21 -> `Short by 15`).
     - `Actions`: `Stock in` button linking to `/inventory/in?v={variant_id}`.
   - Empty State:
     - When all variants are healthy (`stock_quantity > min_stock_level`), render friendly empty state card:
       - Heading: `Nothing is low`
       - Description: `Every variant is above its minimum level.`
   - Footer note:
     - Helpful guidance text: `Change thresholds under Settings, Minimum stock levels.` with a link to `/settings/stock`.

6. **Real-Time Synchronization via Supabase Realtime**:
   - When viewing `/inventory` or `/inventory/low`, the client subscribes to Postgres changes on `public.product_variants`.
   - Whenever any `stock_quantity` or `min_stock_level` changes (due to a POS sale, warehouse stock-in, damage stock-out, or settings update):
     - The local state updates reactively without requiring a page refresh.
     - Meters re-animate to the updated percentage.
     - Low stock lists and status pills dynamically re-evaluate.

7. **Strict Design Tokens & Universal Theming**:
   - Zero hardcoded colors; all elements use semantic tokens from `lib/tokens.ts` and `app/globals.css`.
   - Meter container: `bg-bg-input` / `var(--sunken)` with `border-border`.
   - Meter healthy bar: `bg-primary` (light) / `#22C55E` (dark via CSS variable `--primary`).
   - Meter low/danger bar: `bg-danger` (light) / `#EF4444` (dark via CSS variable `--danger`).
   - High-contrast typography and WCAG 2.1 AA accessible status badges.

---

## 3. Gherkin Acceptance Criteria

```gherkin
Feature: Live Stock Inventory Monitor & Capacity Level Meters (ARL-12)

  Background:
    Given the store catalog contains products "Toyo", "Suka", and "Patis"
    And each product has variants "350", "1L", and "gal"

  Scenario: Low stock level detection
    Given "Patis 350ml" has a minimum threshold of 36 and current stock of 21
    When the admin navigates to "/inventory"
    Then the progress meter is styled with amber/danger warning class ".meter.low"
    And the status pill displays "Low stock"
    And when navigating to "/inventory/low"
    Then "Patis 350 ml" is listed with "Short by" count "15"
    And the stock count displays "21" in warning/danger color.

  Scenario: Out of stock warning
    Given "Suka 1 gal" has 0 units in stock
    When viewing the inventory screen at "/inventory"
    Then the status badge displays "Out of stock" with destructive red styling
    And the meter width is "0%".

  Scenario: Real-time stock sync
    Given an open inventory tab on one device
    When a sale or stock movement occurs that changes "Toyo 1 L" stock from 58 to 56
    Then Supabase Realtime updates the stock count to "56" without requiring a page refresh
    And the capacity meter width re-renders dynamically.

  Scenario: Direct stock-in navigation
    Given a low-stock variant "Patis 350 ml" with id "patis-350-uuid"
    When the admin clicks the "Stock in" action button in that row
    Then the app navigates to "/inventory/in?v=patis-350-uuid".

  Scenario: Empty state when no variants are low
    Given all 9 variants have stock greater than their minimum threshold
    When the admin navigates to "/inventory/low"
    Then an empty state is displayed with heading "Nothing is low"
    And text "Every variant is above its minimum level."
```
