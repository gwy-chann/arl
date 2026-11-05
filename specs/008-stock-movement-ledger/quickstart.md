# Quickstart & Verification Guide: Stock-In & Stock-Out Ledger with Movement Audit

**Feature Key**: `ARL-13`  
**Feature Slug**: `008-stock-movement-ledger`  

---

## 1. Automated Test Verification

Run all unit tests verifying stock in increments, stock out decrements, negative stock prevention, and movement history filtering:

```bash
cd .worktrees/ARL-13
npm test
```

Expected output:
- `Stock-In & Stock-Out Ledger with Movement Audit (ARL-13)` test suite passes with 0 failures.
- All existing suites (`categories`, `products`, `customers`, `theme`, `layout-navigation`) continue to pass.

---

## 2. Interactive Verification Scenarios

### Scenario 1: Warehouse Delivery Stock In
1. Navigate to `/inventory/in`.
2. Select **Product and size**: `Toyo - 1 L (58 in stock)`.
3. Enter **Quantity**: `24`.
4. Select **Source**: `Restock from warehouse`.
5. Enter **Note**: `DR #8841`.
6. Click **Save stock in**.
7. **Verification**:
   - Redirected to `/inventory`.
   - Toast notification appears: `"Stock in saved: Toyo - 1 L now 82"`.
   - On `/inventory/history`, a new movement appears:
     - Type: `Stock in` (green badge)
     - Product: `Toyo - 1 L`
     - Qty: `+24`
     - Note: `Restock from warehouse: DR #8841`

### Scenario 2: Damage Stock Out
1. Navigate to `/inventory/out`.
2. Select **Product and size**: `Suka - 1 gal (6 in stock)`.
3. Enter **Quantity**: `1`.
4. Select **Reason**: `Damaged or spilled`.
5. Enter **Note**: `Cracked cap`.
6. Click **Save stock out**.
7. **Verification**:
   - Redirected to `/inventory`.
   - Toast notification appears: `"Stock out saved: Suka - 1 gal now 5"`.
   - On `/inventory/history`, a new movement appears:
     - Type: `Stock out` (amber/accent badge)
     - Product: `Suka - 1 gal`
     - Qty: `-1`
     - Note: `Damaged or spilled: Cracked cap`

### Scenario 3: Prevent Stock Out Exceeding Available Stock
1. Navigate to `/inventory/out`.
2. Select **Product and size**: `Patis - 1 gal (14 in stock)`.
3. Enter **Quantity**: `15`.
4. Select **Reason**: `Damaged or spilled`.
5. Click **Save stock out**.
6. **Verification**:
   - Form remains on `/inventory/out`.
   - Error toast appears: `"Only 14 in stock"`.
   - Patis 1 gal stock remains unchanged at 14.
   - No row is added to `stock_movements`.

### Scenario 4: Movement History Filtering
1. Navigate to `/inventory/history`.
2. In the Type dropdown, select `"In"`.
3. **Verification**:
   - The table shows only inbound stock movements.
   - All quantities are displayed with positive prefix (`+X`).
   - Selecting `"Out"` shows only outbound stock movements and sales (`-X`).
   - Selecting `"All movements"` shows all historical transactions.
