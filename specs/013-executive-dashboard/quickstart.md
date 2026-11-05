# Quickstart & Verification Guide: Executive Dashboard

**Feature Key**: `ARL-18`  
**Feature Slug**: `013-executive-dashboard`  

---

## 1. Quick Verification Steps

### Step 1: Run the Automated Unit & Acceptance Suite
Inside the feature worktree:
```bash
npm test
```
Verify that `tests/dashboard.test.ts` executes and passes all scenarios.

### Step 2: Visual Inspection in Browser
Start local development server:
```bash
npm run dev
```
Navigate to `http://localhost:3000/dashboard` in your browser.

1. **Verify KPI Cards (`.stats`)**:
   - Inspect top 4 stat cards:
     - "Sales today" displaying total amount and transaction count (e.g., `₱1,240 · 3 transactions`).
     - "Sales this month" displaying monthly total and gross profit.
     - "Outstanding balances" displaying total utang and unpaid sales count.
     - "Low stock items" displaying `"X of 9"` with warning alert styling when count > 0.
2. **Verify 7-Day Sales Bar Chart (`.bars`)**:
   - Check that 7 vertical bars are rendered.
   - Day 0 ("Today") must be highlighted with active brand styling (`.bar.cur`).
   - Hover or view the `<em>` formatted values at the top of each bar.
   - Click "Full report" to ensure navigation to `/reports`.
3. **Verify Stock on Hand Matrix (`.stockgrid`)**:
   - Confirm a 3×3 table showing Toyo, Suka, and Patis alongside 350 ml, 1 L, and 1 gal sizes.
   - Confirm capacity meters indicate stock levels, with low-stock variants highlighted in alert red/amber.
   - Click "Details" to verify navigation to `/inventory`.
4. **Verify Urgent Notices (`.notice`)**:
   - Check that overdue customer debts render with bad dots (`.dot.bad`), debt amount, and "Open sale" button.
   - Clicking "Open sale" navigates directly to `/sales/{id}`.
   - Check that low-stock alerts render with warning dots (`.dot.warn`) and "Stock in" button navigating to `/inventory/in`.
5. **Verify "Who owes you" Widget (`.rowlist`)**:
   - Confirm top debtor ranking sorted by balance descending.
   - Confirm overdue accounts display the "Overdue" badge.
   - Click customer row to verify navigation to `/customers/{id}`.
