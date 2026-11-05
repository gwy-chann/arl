# Quickstart & Verification Guide: Live Stock Inventory Monitor

**Feature Key**: `ARL-12`  
**Feature Slug**: `009-live-stock-inventory-monitor`  

---

## 1. Running the Feature Locally

1. Start development server inside the worktree:
   ```bash
   npm run dev
   ```
2. Open your browser to `http://localhost:3000/login` and log in as administrator.
3. Navigate to `http://localhost:3000/inventory`.

---

## 2. Interactive Scenarios & Manual Verification

### Scenario 1: Verify Overview Table & Capacity Meters (`/inventory`)
- Check that all 9 variants (Toyo, Suka, Patis in 350ml, 1L, 1gal) are listed.
- Verify column layout: Product, Size, In stock, Minimum, Level (meter), Status pill, Actions.
- Verify status badges:
  - Suka 1 gal (stock 6, min 12) -> Badge "Low stock", meter has warning styling `.meter.low`.
  - Patis 350 ml (stock 21, min 36) -> Badge "Low stock".
  - Toyo 350 ml (stock 96, min 48) -> Badge "In stock", meter green.
- Type "Patis" in the search box -> Only Patis variants are shown.
- Type "1L" in the search box -> Only 1L variants are shown.

### Scenario 2: Verify Low Stock Alerts View (`/inventory/low`)
- Click the "Low stock alerts" tab in the sub-navigation strip.
- Verify that only variants with `stock <= min` are displayed.
- Check the "Short by" column:
  - Patis 350 ml: Minimum 36, Stock 21 -> "Short by" is 15.
  - Suka 1 gal: Minimum 12, Stock 6 -> "Short by" is 6.
- In-stock count is rendered in danger color.
- Click "Stock in" button on any row -> Verifies navigation to `/inventory/in?v={variantId}`.

### Scenario 3: Realtime Synchronization
- Open two browser windows side by side to `http://localhost:3000/inventory`.
- In database or via API update `stock_quantity` of a variant.
- Verify the stock count, meter width, and status pill update in the other window immediately without page refresh.

---

## 3. Automated Test Verification

Run all test suites inside the worktree:
```bash
npm test -- __tests__/inventory/
npm run typecheck
npm run lint
```
