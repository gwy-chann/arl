# Quickstart & Verification Guide: In-Form Category Creation & Dynamic Product Variant Management

**Feature Key**: `ARL-38`  
**Feature Slug**: `027-dynamic-product-variants-in-form-categories`  
**Jira Story**: STORY-2.5: In-Form Category Creation & Dynamic Product Variant Management  

---

## 1. Environment & Setup

Inside the isolated worktree directory (`.worktrees/ARL-38`):

```bash
# 1. Apply Supabase migration
npx supabase db push
# or verify migration syntax locally:
# supabase migration apply

# 2. Run automated test suites
npm test tests/dynamic-product-variants.test.ts

# 3. Start local development server
npm run dev
```

---

## 2. Interactive Verification Scenarios

### Scenario 1: Inline Category Creation (`/products/new`)
1. Navigate to `http://localhost:3000/products/new`.
2. Enter "Premium Cooking Oil" in the Product name input.
3. Click the "+ Add new category" button next to the Category dropdown.
4. An inline modal opens. Enter category name "Cooking Oil" and click "Save category".
5. Verify:
   - Category is created and toast "Category added" appears.
   - The Category dropdown immediately updates and selects "Cooking Oil".
   - The previously typed "Premium Cooking Oil" product name is preserved without loss.

### Scenario 2: Adding a Custom Variant to Existing Product (`/products/[id]/edit`)
1. Navigate to `/products` and select "Toyo" to edit (`/products/[id]/edit`).
2. Observe existing variants (350 ml, 1 L, 1 gal).
3. Click the "+ Add size variant" button below the variants table.
4. A new row appears with empty fields.
5. Enter:
   - Size: "500 ml"
   - Cost price: `22.00`
   - Selling price: `30.00`
   - Minimum stock: `20`
6. Click "Save product".
7. Verify:
   - Redirects to `/products` with toast "Product saved".
   - Toyo table rows now display 4 packaging sizes including "500 ml".
   - Historical sales data remains unaffected.

### Scenario 3: Dynamic Variant Rows on New Product (`/products/new`)
1. Navigate to `/products/new`.
2. Fill product name "Spicy Vinegar".
3. Remove variant rows until only 1 remains (or add custom rows like "20 L Drum").
4. Enter pricing and stock for the variant row.
5. Click "Save product".
6. Verify successful creation with non-standard variant count.

### Scenario 4: Duplicate Variant Validation Error
1. In either `/products/new` or `/products/[id]/edit`, configure two variant rows with the exact same size (e.g., both labeled "1 L" or "500 ml").
2. Attempt to submit the form.
3. Verify:
   - Submission is blocked.
   - An error banner displays: "Variant sizes must be unique for each product".

### Scenario 5: Downstream Verification
1. Open POS checkout (`/sales/new`).
2. Select the product with custom variants. Verify the custom packaging options (e.g. "500 ml") are selectable with correct selling prices.
3. Open Stock Monitor (`/inventory`). Verify the inventory row shows the custom packaging size.
