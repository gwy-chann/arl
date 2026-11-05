# Quickstart & Verification Guide: Printable Official Sales Receipt

**Feature Key**: `ARL-16`  
**Feature Slug**: `012-printable-sales-receipt`  

---

## 1. Quick Verification Steps

### Step 1: Run Automated Test Suites
Run the dedicated test suite for ARL-16:
```bash
npm test
```
Confirm all receipt snapshot transformations, payment stamp classifications, and boundary edge cases pass.

### Step 2: Navigate to Sale Detail
1. Start development server: `npm run dev`.
2. Visit `http://localhost:3000/sales`.
3. Click on any sale row (e.g. `ARLQ-01041`).
4. On the `/sales/[id]` page, verify the `Print receipt` action button exists in the header.

### Step 3: Open Receipt Preview
1. Click `Print receipt`.
2. Browser navigates to `/receipt/[id]`.
3. Verify visual hierarchy:
   - Breadcrumbs: `Sales / ARLQ-XXXXX / Receipt`.
   - Header: `Receipt preview` / `Review and print.`
   - Action buttons: `Print receipt` (primary with printer icon) and `Back to sale` (secondary).
   - Centered 58mm/80mm thermal receipt card rendered in monospace font (`font-mono`, Courier Prime).
   - Header: **ARLQ Food Condiments Trading** / `Official Receipt`.
   - Dashed horizontal lines separating header, items, totals, and stamps.
   - Item rows: `{Variant Label}` with subline `{qty} × {price}` on left, `{line_total}` on right.
   - Totals: `TOTAL`, `Amount paid`, and `Remaining balance` (if > 0).
   - Bold uppercase stamp: `PAID`, `PARTIALLY PAID`, or `NOT YET PAID`.
   - Footer: `Thank you for your business!`.

### Step 4: Test Print Dialog & Stylesheet
1. Click `Print receipt`.
2. Native browser print dialog opens.
3. In print preview:
   - Verify sidebar, topbar, breadcrumbs, and action buttons are hidden.
   - Verify receipt card expands cleanly with pure white background and crisp black text.
   - Cancel print dialog.

### Step 5: Test Navigation Return
1. Click `Back to sale`.
2. Verify browser returns directly to `/sales/[id]`.
