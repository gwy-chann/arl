# Quickstart & Verification Guide: Product Category Management with Cascade Validation

**Feature Key**: `ARL-7`  
**Feature Slug**: `005-product-category-management`  

---

## 1. Quick Verification Commands

From the worktree root (`.worktrees/ARL-7`):

```bash
# 1. Run automated unit tests
npm test

# 2. Run TypeScript compilation check
npx tsc --noEmit

# 3. Run ESLint verification
npm run lint

# 4. Start local development server
npm run dev
```

---

## 2. Interactive Browser Walkthrough Scenarios

Login to the administrative dashboard and navigate to `http://localhost:3000/products/categories`:

### Scenario 1: Add new condiment category
1. Click the **"Add category"** button in the page header.
2. Observe that the modal dialog opens with title `"Add category"`, with focus trapped and auto-focused on the category name input.
3. Type `"Specialty Blends"` and click **"Save category"**.
4. **Expected Results**:
   - The modal closes.
   - A success toast appears with message `"Category saved"`.
   - The table immediately displays `"Specialty Blends"` with product count `0`.

### Scenario 2: Rename existing category
1. In the category table, find the `"Soy Sauce"` row.
2. Click the **"Rename"** button.
3. Observe that the modal dialog opens with title `"Rename category"` and the input pre-filled with `"Soy Sauce"`.
4. Update the name to `"Premium Soy Sauce"` and click **"Save category"**.
5. **Expected Results**:
   - The modal closes.
   - A success toast appears with message `"Category saved"`.
   - The category name in the table immediately updates to `"Premium Soy Sauce"`.

### Scenario 3: Delete category with orphan warning check
1. Locate a category containing linked products (e.g. `"Vinegar"` with 3 products).
2. Click the **"Delete"** button.
3. Observe that the confirmation modal opens with:
   - Title: `"Delete Vinegar?"`
   - Warning Message: `"3 products are in this category. They will become uncategorized."`
   - Confirm button: `"Delete category"` (danger variant).
4. Click **"Cancel"**:
   - The modal closes with zero state changes. The category and products remain intact.
5. Click **"Delete"** again, and click **"Delete category"**:
   - The category is removed from the table.
   - Linked products have `category_id` set to `NULL`.
   - A success toast appears with message `"Category deleted"`.

### Scenario 4: Delete empty category
1. Click **"Delete"** on any category with `0` products (e.g. the newly added `"Specialty Blends"`).
2. Observe that the confirmation modal displays:
   - Title: `"Delete Specialty Blends?"`
   - Body Message: `"This category is empty."`
3. Click **"Delete category"**:
   - The category is deleted without error.
   - A success toast appears with message `"Category deleted"`.
   - The category is removed from the table.
